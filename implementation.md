Bhai this is a MASSIVE scope — we're talking about building a full n8n-grade platform. Let me write one complete master instruction that covers the entire thing end to end.

---

# TORQUE — FULL PLATFORM BUILD INSTRUCTIONS
## Target: Production-grade n8n alternative with App Connectors, MCP, and Agent Skills

You are a senior full-stack engineer building a complete workflow automation platform called Torque. Think n8n — but with native AI agent capabilities, MCP server support, and a modern React canvas UI. This document is your complete specification. Read everything before writing a single line of code.

---

## PART 0 — ARCHITECTURE DECISIONS (non-negotiable)

**Backend**: Node.js + TypeScript + Express. All new modules must be written in TypeScript with strict mode on. No `any`. No `as X` casts without a zod-validated type backing it.

**Database**: Migrate off JSON files immediately. Use `better-sqlite3` as the persistence layer for all entities — workflows, runs, credentials, connectors, MCP servers, agent skills. Use raw SQL with a migration system (`better-sqlite3-migrations`). This single change eliminates all race conditions, atomic write issues, and corruption risk from the audit.

**Queue**: Use `better-queue` for workflow execution queue. All workflow runs are enqueued, not executed inline in the request handler. This enables async execution, retries, and concurrency control.

**Auth**: Implement JWT-based auth from day one. Every API route requires a valid JWT. Use `jose` library for token signing/verification. Store hashed passwords with `argon2`. Auth routes: POST `/auth/register`, POST `/auth/login`, POST `/auth/refresh`, POST `/auth/logout`.

**Frontend**: React + TypeScript + Vite. Use `@xyflow/react` (React Flow) as the workflow canvas — it is the industry standard for node graph UIs and powers n8n's canvas. Use `zustand` for global state. Use `@tanstack/react-query` for all server state and data fetching. Use `shadcn/ui` for base components. Tailwind CSS for styling.

**Connector Architecture**: Every connector is a self-contained TypeScript class that implements the `IConnector` interface. Connectors are registered in a central registry at startup. This is the single most important architectural decision — every new connector must follow this pattern.

**Real-time**: Use `socket.io` for real-time workflow run log streaming to the frontend. No HTTP polling.

---

## PART 1 — CORE INTERFACES (implement these first, everything else depends on them)

### 1.1 — IConnector Interface

Create `backend/src/core/interfaces/IConnector.ts`:

Every connector in the system must implement this interface. A connector represents a third-party service (Gmail, Slack, GitHub, etc.) and exposes a list of operations (actions/triggers) that can be used as workflow nodes.

The interface must define:

- `id: string` — unique snake_case identifier, e.g. `gmail`, `github`, `slack`
- `name: string` — display name
- `description: string` — one-line description
- `icon: string` — SVG string or URL
- `category: ConnectorCategory` — enum: `communication`, `productivity`, `developer`, `data`, `finance`, `marketing`, `crm`, `storage`, `ai`, `utility`
- `authType: AuthType` — enum: `oauth2`, `api_key`, `basic`, `none`, `custom`
- `authConfig: AuthConfig` — object describing how to authenticate (OAuth2 endpoints, API key header name, etc.)
- `operations: IOperation[]` — list of all actions and triggers this connector exposes
- `testConnection(credential: Credential): Promise<ConnectionTestResult>` — method to verify a credential is valid

### 1.2 — IOperation Interface

An operation is a single action or trigger exposed by a connector — e.g. "Send Email" on Gmail, "Create Issue" on GitHub.

The interface must define:

- `id: string` — unique within the connector, e.g. `send_email`, `create_issue`
- `name: string` — display name
- `description: string`
- `type: OperationType` — enum: `action`, `trigger`, `webhook`, `polling`
- `inputSchema: ZodSchema` — zod schema describing all input parameters for this operation
- `outputSchema: ZodSchema` — zod schema describing the output this operation produces
- `execute(input: ValidatedInput, credential: Credential, context: ExecutionContext): Promise<OperationOutput>` — the actual implementation
- `fields: IField[]` — UI field definitions for the node config panel (label, type, placeholder, required, options for selects, etc.)

### 1.3 — IAgentSkill Interface

Create `backend/src/core/interfaces/IAgentSkill.ts`:

An agent skill is a capability an AI agent node can call during execution — web search, code execution, file read/write, etc.

The interface must define:

- `id: string`
- `name: string`
- `description: string` — this description is passed to the LLM as a tool description, so write it clearly
- `inputSchema: ZodSchema`
- `outputSchema: ZodSchema`
- `execute(input: ValidatedInput, context: ExecutionContext): Promise<SkillOutput>`

### 1.4 — ExecutionContext

Create `backend/src/core/types/ExecutionContext.ts`:

This object is passed to every operation and skill during execution. It must contain:

- `runId: string` — unique ID for this workflow run
- `workflowId: string`
- `nodeId: string` — ID of the node currently executing
- `userId: string`
- `logger: Logger` — pino logger instance scoped to this run
- `emit(event: string, data: unknown): void` — emit a real-time event via socket.io to the frontend
- `getNodeOutput(nodeId: string): unknown` — access output from any previously executed node
- `variables: Record<string, unknown>` — workflow-level variables
- `credentials: CredentialAccessor` — method to get a credential by ID (masked for logs, raw for HTTP calls)

---

## PART 2 — WORKFLOW ENGINE (rewrite from scratch)

### 2.1 — Execution Model

The workflow engine must support the following node execution model:

- **DAG execution**: Parse the workflow graph into a directed acyclic graph. Nodes with no dependencies execute first. Nodes execute as soon as all their upstream dependencies have completed.
- **Parallel execution**: Independent branches of the graph execute in parallel using `Promise.all`.
- **Data passing**: Each node receives the output of its upstream node(s) as its input. In a merge scenario (multiple upstream nodes), inputs are combined into an array.
- **Error handling per node**: Each node has an `onError` setting: `stop` (halt the entire run), `continue` (skip this node, pass null downstream), `retry` (retry up to N times with exponential backoff).

### 2.2 — Run Lifecycle

Every workflow run must transition through these states stored in the database: `queued` → `running` → `completed` | `failed` | `cancelled`.

Each node execution within a run also has its own state: `pending` → `running` → `completed` | `failed` | `skipped`.

Store the following for every node execution: `startedAt`, `completedAt`, `durationMs`, `input` (sanitized — no secrets), `output` (truncated if over 10KB), `error` (if failed).

### 2.3 — Trigger System

Implement three trigger mechanisms:

**Webhook triggers**: Each workflow with a webhook trigger node gets a unique URL at `/webhooks/:workflowId/:secret`. Incoming POST requests to this URL immediately enqueue a run with the request body as the trigger data.

**Schedule triggers**: Use `node-cron` for cron-based scheduling. On server startup, load all active scheduled workflows from the database and register them with node-cron. Handle add/remove/update when workflows are saved.

**Polling triggers**: Some connectors (Gmail new email, RSS feed, etc.) don't support webhooks. These use polling — a background interval checks for new data and fires a run if something new is found. Use `node-cron` with a minimum interval of 1 minute. Store a `lastCheckedAt` and `lastSeenId` per workflow to avoid duplicate runs.

---

## PART 3 — APP CONNECTORS (implement all of the following)

For each connector below, implement the full `IConnector` interface. Every connector must have: authentication flow, credential test, and at minimum the listed operations. Use the official REST API for each service — no SDKs unless they are thin wrappers (e.g. `@slack/web-api` is acceptable, a heavy framework is not).

### 3.1 — Communication Connectors

**Gmail** (`gmail`):
- Auth: OAuth2. Scopes: `gmail.send`, `gmail.readonly`, `gmail.modify`.
- Operations: `send_email` (to, cc, bcc, subject, body html/text, attachments), `get_email` (by message ID), `list_emails` (with filters: from, to, subject, label, unread only, date range, limit), `reply_to_email`, `forward_email`, `create_draft`, `add_label`, `remove_label`, `mark_read`, `mark_unread`, `move_to_trash`, `search_emails` (Gmail query string).
- Trigger: `new_email` (polling, checks for new emails matching filter every N minutes).

**Outlook / Microsoft 365** (`outlook`):
- Auth: OAuth2 via Microsoft identity platform (tenant-aware).
- Operations: `send_email`, `list_emails`, `get_email`, `reply_to_email`, `create_draft`, `move_email`, `list_folders`.
- Trigger: `new_email`.

**Slack** (`slack`):
- Auth: OAuth2. Bot token with required scopes.
- Operations: `send_message` (channel, text, blocks), `send_dm` (user ID or email), `reply_to_thread` (channel, thread_ts, text), `update_message`, `delete_message`, `upload_file` (channel, filename, content), `list_channels`, `get_channel_info`, `list_members`, `get_user_info`, `set_channel_topic`, `create_channel`, `invite_to_channel`, `react_to_message`, `pin_message`, `schedule_message`.
- Trigger: `new_message` (webhook via Slack Events API), `new_mention`, `new_reaction`.

**Discord** (`discord`):
- Auth: Bot token.
- Operations: `send_message` (channel ID, content, embeds), `send_dm`, `edit_message`, `delete_message`, `create_thread`, `add_role`, `remove_role`, `list_guild_members`, `kick_member`, `ban_member`.
- Trigger: `new_message` (webhook).

**Telegram** (`telegram`):
- Auth: Bot token.
- Operations: `send_message` (chat ID, text, parse mode markdown/html), `send_photo`, `send_document`, `send_poll`, `edit_message`, `delete_message`, `pin_message`, `get_chat_info`, `get_chat_members`.
- Trigger: `new_message` (webhook via Telegram Webhook API).

**WhatsApp Business** (`whatsapp`):
- Auth: Meta API token + phone number ID.
- Operations: `send_text_message`, `send_template_message` (template name, language, parameters), `send_image`, `send_document`, `send_location`, `mark_as_read`.
- Trigger: `new_message` (webhook).

**Twilio** (`twilio`):
- Auth: Account SID + Auth Token.
- Operations: `send_sms` (to, from, body), `send_whatsapp`, `make_call` (to, from, twiml URL), `send_mms` (with media URL), `get_message_status`.
- Trigger: `new_sms` (webhook).

### 3.2 — Productivity Connectors

**Notion** (`notion`):
- Auth: OAuth2 or Internal Integration Token.
- Operations: `create_page` (parent database ID, properties), `get_page` (page ID), `update_page` (page ID, properties), `archive_page`, `query_database` (database ID, filter object, sorts, limit), `create_database_entry`, `update_database_entry`, `append_blocks` (page ID, blocks array), `get_block_children`, `search` (query, filter by type).

**Google Sheets** (`google_sheets`):
- Auth: OAuth2.
- Operations: `get_values` (spreadsheet ID, range A1 notation), `set_values` (range, values 2D array), `append_row` (spreadsheet ID, sheet name, row data as object mapped to headers), `clear_range`, `create_spreadsheet`, `add_sheet`, `delete_sheet`, `get_sheet_names`, `batch_get` (multiple ranges), `format_range` (cell formatting).
- Trigger: `row_added` (polling).

**Google Docs** (`google_docs`):
- Auth: OAuth2.
- Operations: `create_document`, `get_document`, `insert_text` (at end or at index), `replace_text` (find/replace throughout doc), `list_documents`.

**Google Calendar** (`google_calendar`):
- Auth: OAuth2.
- Operations: `create_event` (calendar ID, title, start, end, attendees, description, location, recurrence), `get_event`, `update_event`, `delete_event`, `list_events` (calendar ID, time range, search query), `list_calendars`, `respond_to_event` (accept/decline/tentative).
- Trigger: `new_event`, `event_updated`, `event_starting_soon` (polling).

**Airtable** (`airtable`):
- Auth: Personal Access Token.
- Operations: `list_records` (base ID, table name, filter formula, sort, limit), `get_record`, `create_record` (fields object), `update_record`, `upsert_record` (create or update based on a field match), `delete_record`, `list_bases`, `list_tables`.
- Trigger: `new_record` (polling).

**Microsoft Excel / OneDrive** (`excel`):
- Auth: OAuth2 (same as Outlook).
- Operations: `get_worksheet_data`, `add_row`, `update_row`, `clear_range`, `create_workbook`.

**Trello** (`trello`):
- Auth: API Key + Token.
- Operations: `create_card` (list ID, name, description, due date, labels, members), `get_card`, `update_card`, `move_card` (to list ID), `archive_card`, `add_comment`, `add_attachment`, `list_cards` (list ID), `create_list`, `list_boards`.
- Trigger: `new_card`, `card_moved` (webhook).

**Asana** (`asana`):
- Auth: OAuth2 or Personal Access Token.
- Operations: `create_task` (project ID, name, assignee, due date, notes, tags), `get_task`, `update_task`, `complete_task`, `delete_task`, `list_tasks` (project ID, assignee, filter), `create_project`, `list_projects`, `add_comment`.
- Trigger: `new_task`, `task_completed` (webhook).

**Jira** (`jira`):
- Auth: API Token (Basic auth with email + token) for cloud.
- Operations: `create_issue` (project key, summary, description, issue type, priority, assignee, labels), `get_issue`, `update_issue`, `transition_issue` (to status), `add_comment`, `search_issues` (JQL query), `list_projects`, `get_project`, `create_project`, `assign_issue`, `log_work`.
- Trigger: `new_issue`, `issue_updated` (webhook).

**Linear** (`linear`):
- Auth: OAuth2 or API Key.
- Operations: `create_issue` (team ID, title, description, priority, assignee), `get_issue`, `update_issue`, `list_issues` (filter by team, state, assignee), `list_teams`, `list_projects`.
- Trigger: `new_issue`, `issue_status_changed` (webhook).

**ClickUp** (`clickup`):
- Auth: OAuth2 or Personal Token.
- Operations: `create_task`, `get_task`, `update_task`, `list_tasks` (list ID, filter), `list_lists`, `list_spaces`.
- Trigger: `new_task`, `task_updated` (webhook).

### 3.3 — Developer Connectors

**GitHub** (`github`):
- Auth: OAuth2 or Personal Access Token.
- Operations: `create_issue` (owner, repo, title, body, labels, assignees), `get_issue`, `update_issue`, `close_issue`, `list_issues` (filter by state, labels, assignee, milestone), `create_pr` (head, base, title, body, draft), `get_pr`, `merge_pr`, `list_prs`, `create_comment` (on issue or PR), `create_release` (tag, name, body, draft, prerelease), `list_releases`, `get_file` (owner, repo, path, ref), `create_or_update_file`, `list_repos`, `search_code` (query, repo filter), `trigger_workflow` (workflow ID, ref, inputs), `list_workflow_runs`.
- Trigger: `new_issue`, `new_pr`, `push` (webhook — provide webhook secret config), `issue_comment`, `pr_merged`, `release_published`.

**GitLab** (`gitlab`):
- Auth: Personal Access Token or OAuth2.
- Operations: `create_issue`, `get_issue`, `update_issue`, `list_issues`, `create_mr` (merge request), `get_mr`, `merge_mr`, `list_mrs`, `create_comment`, `trigger_pipeline` (project ID, ref, variables).
- Trigger: `new_issue`, `new_mr`, `pipeline_completed` (webhook).

**Bitbucket** (`bitbucket`):
- Auth: OAuth2.
- Operations: `create_issue`, `list_issues`, `create_pr`, `list_prs`, `merge_pr`, `list_repos`.
- Trigger: `new_pr`, `push` (webhook).

**Vercel** (`vercel`):
- Auth: API Token.
- Operations: `list_projects`, `get_project`, `list_deployments` (project ID), `get_deployment`, `trigger_deployment` (project ID, git ref), `cancel_deployment`, `list_domains`, `add_domain`, `remove_domain`, `get_env_vars`, `set_env_var`.
- Trigger: `deployment_completed`, `deployment_failed` (webhook).

**Cloudflare** (`cloudflare`):
- Auth: API Token.
- Operations: `list_zones`, `purge_cache` (zone ID, all or specific URLs), `list_dns_records` (zone ID), `create_dns_record`, `update_dns_record`, `delete_dns_record`, `deploy_worker` (name, script), `list_workers`.

**Render** (`render`):
- Auth: API Key.
- Operations: `list_services`, `get_service`, `trigger_deploy` (service ID), `list_deploys` (service ID), `get_deploy`, `restart_service`, `suspend_service`, `resume_service`, `list_env_vars`, `update_env_var`.
- Trigger: `deploy_succeeded`, `deploy_failed` (webhook).

**Supabase** (`supabase`):
- Auth: Service Role Key + Project URL.
- Operations: `execute_sql` (arbitrary SQL query), `select` (table, columns, filters, order, limit), `insert` (table, rows), `update` (table, data, match condition), `upsert`, `delete` (table, match condition), `call_function` (function name, params), `upload_file` (bucket, path, content), `get_signed_url` (bucket, path, expiry).

**PlanetScale / MySQL** (`mysql`):
- Auth: Connection string.
- Operations: `execute_query` (SQL, parameters), `select`, `insert`, `update`, `delete`.

**PostgreSQL** (`postgres`):
- Auth: Connection string.
- Operations: `execute_query`, `select`, `insert`, `update`, `upsert`, `delete`, `call_procedure`.

**MongoDB** (`mongodb`):
- Auth: Connection string.
- Operations: `find` (collection, filter, projection, sort, limit), `find_one`, `insert_one`, `insert_many`, `update_one`, `update_many`, `delete_one`, `delete_many`, `aggregate` (pipeline), `count`.

**Redis** (`redis`):
- Auth: Connection string.
- Operations: `get`, `set` (key, value, TTL), `del`, `exists`, `incr`, `decr`, `lpush`, `rpop`, `publish` (channel, message), `hget`, `hset`, `hgetall`.

### 3.4 — Finance Connectors

**Stripe** (`stripe`):
- Auth: Secret Key.
- Operations: `create_customer` (email, name, metadata), `get_customer`, `update_customer`, `list_customers`, `create_payment_intent` (amount, currency, customer, metadata), `confirm_payment_intent`, `cancel_payment_intent`, `create_refund` (charge ID, amount), `list_charges` (customer, limit), `create_invoice` (customer), `send_invoice`, `list_invoices`, `create_subscription` (customer, price ID), `cancel_subscription`, `create_coupon`, `retrieve_balance`.
- Trigger: `payment_succeeded`, `payment_failed`, `subscription_created`, `subscription_cancelled`, `invoice_paid` (webhook — Stripe signature verification required).

**Razorpay** (`razorpay`):
- Auth: Key ID + Key Secret.
- Operations: `create_order` (amount, currency, receipt, notes), `get_order`, `list_orders`, `create_payment_link`, `capture_payment`, `create_refund`, `list_payments`.
- Trigger: `payment_captured`, `refund_created` (webhook with signature verification).

**PayPal** (`paypal`):
- Auth: Client ID + Secret (OAuth2 client credentials flow).
- Operations: `create_order` (amount, currency), `capture_order`, `get_order`, `create_invoice`, `send_invoice`, `list_transactions`.
- Trigger: `payment_completed` (webhook).

### 3.5 — CRM and Marketing Connectors

**HubSpot** (`hubspot`):
- Auth: OAuth2 or Private App Token.
- Operations: `create_contact` (email, firstname, lastname, phone, company, properties object), `get_contact`, `update_contact`, `search_contacts` (filter groups), `delete_contact`, `create_company`, `get_company`, `update_company`, `search_companies`, `create_deal` (deal name, stage, amount, associated contacts and companies), `update_deal`, `list_deals`, `create_ticket`, `update_ticket`, `list_tickets`, `create_note` (body, associations), `create_task`, `list_activities`, `enroll_in_sequence`.
- Trigger: `new_contact`, `deal_stage_changed`, `new_form_submission` (webhook).

**Salesforce** (`salesforce`):
- Auth: OAuth2 (connected app).
- Operations: `query` (SOQL string), `create_record` (object type, fields), `get_record` (object type, ID), `update_record`, `upsert_record` (by external ID), `delete_record`, `describe_object`, `list_objects`.
- Trigger: `record_created`, `record_updated` (via Streaming API / Change Data Capture).

**Mailchimp** (`mailchimp`):
- Auth: API Key.
- Operations: `add_subscriber` (list ID, email, merge fields, tags), `update_subscriber`, `unsubscribe`, `get_subscriber`, `add_tag`, `remove_tag`, `send_campaign` (campaign ID), `create_campaign`, `list_lists`, `list_campaigns`.
- Trigger: `subscribe`, `unsubscribe` (webhook).

**Brevo / SendinBlue** (`brevo`):
- Auth: API Key.
- Operations: `send_transactional_email` (to, from, subject, html/text, template ID, params), `add_contact`, `update_contact`, `delete_contact`, `list_contacts`, `create_email_campaign`, `send_campaign`.

**ConvertKit** (`convertkit`):
- Auth: API Key + Secret.
- Operations: `add_subscriber` (form ID, email, first name, tags), `untag_subscriber`, `list_subscribers`, `list_forms`, `list_tags`, `create_broadcast`.
- Trigger: `new_subscriber` (webhook).

### 3.6 — Storage Connectors

**AWS S3** (`aws_s3`):
- Auth: Access Key ID + Secret + Region.
- Operations: `list_buckets`, `list_objects` (bucket, prefix, limit), `get_object` (bucket, key) → returns content, `put_object` (bucket, key, content, content type, ACL), `delete_object`, `copy_object`, `get_presigned_url` (bucket, key, expiry seconds), `create_bucket`, `delete_bucket`.

**Cloudflare R2** (`cloudflare_r2`):
- Auth: Access Key + Secret + Account ID + Bucket (S3-compatible).
- Operations: Same as S3 — use the AWS S3 SDK pointed at the R2 endpoint.

**Google Drive** (`google_drive`):
- Auth: OAuth2.
- Operations: `list_files` (query, parent folder, mime type filter, limit), `get_file_metadata`, `download_file` (returns base64 content), `upload_file` (name, content, parent folder, mime type), `create_folder`, `move_file` (new parent), `copy_file`, `delete_file`, `share_file` (email, role), `get_file_permissions`, `create_shortcut`.
- Trigger: `new_file_in_folder` (polling).

**Dropbox** (`dropbox`):
- Auth: OAuth2.
- Operations: `list_folder`, `get_file_metadata`, `download_file`, `upload_file`, `create_folder`, `move`, `copy`, `delete`, `get_shared_link`.
- Trigger: `new_file` (webhook via Dropbox webhooks).

**OneDrive** (`onedrive`):
- Auth: OAuth2 (same as Outlook).
- Operations: `list_items` (drive ID, folder path), `get_item`, `download_file`, `upload_file`, `create_folder`, `move_item`, `delete_item`.

### 3.7 — AI Connectors

**OpenAI** (`openai`):
- Auth: API Key.
- Operations: `chat_completion` (model, messages array, temperature, max tokens, response format, tools/function calling), `create_completion` (legacy), `create_embedding` (model, input text/texts), `generate_image` (model dall-e-2/3, prompt, size, quality, n), `transcribe_audio` (model whisper-1, audio file base64, language), `translate_audio`, `create_assistant`, `list_assistants`, `create_thread`, `add_message_to_thread`, `run_thread` (assistant ID), `list_messages` (thread ID), `create_fine_tuning_job`, `list_fine_tuning_jobs`, `moderate_content`.

**Anthropic / Claude** (`anthropic`):
- Auth: API Key.
- Operations: `chat_completion` (model, messages, max tokens, temperature, system prompt, tools), `count_tokens`.

**Google Gemini** (`gemini`):
- Auth: API Key.
- Operations: `generate_content` (model, contents, generation config), `embed_content`, `list_models`.

**Groq** (`groq`):
- Auth: API Key.
- Operations: `chat_completion` (model, messages, temperature, max tokens).

**Mistral** (`mistral`):
- Auth: API Key.
- Operations: `chat_completion`, `create_embedding`.

**Cohere** (`cohere`):
- Auth: API Key.
- Operations: `generate` (model, prompt, max tokens), `chat` (message, model, tools), `embed` (texts, model), `classify` (inputs, examples), `rerank` (query, documents, model).

**Hugging Face** (`huggingface`):
- Auth: API Token.
- Operations: `text_generation` (model, inputs, parameters), `text_classification`, `token_classification`, `question_answering`, `summarization`, `translation`, `sentence_similarity`, `image_classification`, `object_detection`.

**ElevenLabs** (`elevenlabs`):
- Auth: API Key.
- Operations: `text_to_speech` (voice ID, text, model, voice settings) → returns audio base64, `list_voices`, `clone_voice`, `speech_to_speech`.

### 3.8 — Utility Connectors

**HTTP Request** (`http`):
- Auth: None / API Key header / Bearer token / Basic / OAuth2.
- Operations: `request` (method, URL, headers, query params, body as JSON/form/raw, auth, follow redirects, timeout, response type).
- This is the "escape hatch" connector for any service not natively supported.

**RSS / Atom Feed** (`rss`):
- Auth: None or basic.
- Operations: `get_feed_items` (URL, limit).
- Trigger: `new_feed_item` (polling).

**Webhook** (`webhook`):
- Trigger only: Exposes a unique URL. Any HTTP request to this URL triggers the workflow. Returns the request body, headers, method, and query params as trigger data.

**Cron / Schedule** (`schedule`):
- Trigger only: Fires the workflow on a cron expression or interval. Fields: `cronExpression` (string, validated with cron-parser), `timezone`, `runOnce` (boolean). Also supports interval shorthand: every N minutes/hours/days.

**Email (SMTP/IMAP)** (`email`):
- Auth: SMTP/IMAP credentials.
- Operations: `send_email` (SMTP — to, from, subject, html, text, attachments), `receive_emails` (IMAP — mailbox, unread only, mark as read, limit).
- Trigger: `new_email` (IMAP polling).

**Code** (`code`):
- Auth: None.
- Operations: `run_javascript` (code string, input data available as `$input`) — execute arbitrary user JS in a sandboxed `vm2` environment. The code returns a value that becomes the node output. Timeout: 30 seconds.

**Transform / Set Variables** (`transform`):
- Operations: `set` (define key-value pairs where values can be static or expressions referencing upstream node outputs using `{{ $node.NodeName.output.field }}` syntax), `rename_keys`, `filter_keys`, `merge_objects`, `flatten`, `map_array`, `filter_array`, `sort_array`.

**Conditional / IF** (`conditional`):
- Operations: `if` (condition expression, true branch, false branch). Evaluate conditions like `{{ $input.status }} === 'active'`. Route data to different branches based on the result.

**Switch** (`switch`):
- Operations: `switch` (value expression, cases array where each case has a match value and output index).

**Loop / Split in Batches** (`loop`):
- Operations: `split_in_batches` (input array, batch size), `loop_over_items` (execute downstream nodes once per item in an array).

**Wait / Delay** (`wait`):
- Operations: `wait` (duration in seconds, or wait until a specific datetime).

**Merge** (`merge`):
- Operations: `merge` (combine outputs from multiple branches — modes: append all items, keep matching by key, merge key-value pairs).

**Respond to Webhook** (`respond_webhook`):
- Operations: `respond` (status code, body, headers) — send a response back to the original webhook trigger. Must be used in webhook-triggered workflows when a synchronous response is needed.

---

## PART 4 — MCP CONNECTOR SYSTEM

The MCP system allows connecting any Model Context Protocol server as a source of tools that can be used by Agent nodes in workflows.

### 4.1 — MCP Registry

Create `backend/src/mcp/MCPRegistry.ts`:

The registry manages connected MCP servers. It must:

- Store MCP server configs in the database: `id`, `name`, `url`, `transport` (sse or stdio), `userId`, `status` (connected/disconnected/error), `lastPingAt`, `tools` (JSON array of discovered tools).
- On startup, attempt to connect to all registered MCP servers for each user.
- Implement `connect(serverConfig)` — establishes SSE connection or stdio process, calls `tools/list` to discover available tools, stores the tool list.
- Implement `callTool(serverId, toolName, args)` — routes the tool call to the correct server, handles errors and timeouts.
- Implement `ping(serverId)` — health check, update `lastPingAt` and `status`.
- Implement a background reconnect loop — if a server goes to `error` or `disconnected` state, retry with exponential backoff every 30 seconds up to 5 minutes.

### 4.2 — MCP Node Type

Add an `mcp_tool` node type to the workflow engine. This node:

- Has a `serverId` field (select from connected MCP servers) and a `toolName` field (populated dynamically based on the selected server's tool list).
- At runtime, calls `MCPRegistry.callTool(serverId, toolName, args)` where `args` is built from the node's input using expression syntax.
- The output is whatever the MCP tool returns.

### 4.3 — Built-in MCP Servers

Pre-configure (but do not auto-connect — user must explicitly enable) the following well-known MCP servers so they appear in a "Marketplace" tab in the MCP modal:

- `@modelcontextprotocol/server-filesystem` — local file system read/write
- `@modelcontextprotocol/server-github` — GitHub operations
- `@modelcontextprotocol/server-google-maps` — maps and places
- `@modelcontextprotocol/server-postgres` — PostgreSQL queries
- `@modelcontextprotocol/server-slack` — Slack operations
- `@modelcontextprotocol/server-puppeteer` — browser automation
- `@modelcontextprotocol/server-brave-search` — web search via Brave
- `@modelcontextprotocol/server-fetch` — HTTP fetch tool
- `firecrawl-mcp` — web scraping
- `@notionhq/notion-mcp-server` — Notion
- `mcp-server-neon` — Neon PostgreSQL
- `mcp-vercel` — Vercel deployments

For each, store: npm package name, description, required env vars with descriptions, icon.

---

## PART 5 — AGENT SKILLS SYSTEM

Agent nodes in the workflow can run an LLM in an agentic loop — the model decides which skills to call, calls them, observes results, and repeats until the task is done.

### 5.1 — Agent Node

The agent node config must define:

- `provider`: which AI provider to use (openai, anthropic, gemini, groq, etc.)
- `model`: specific model string
- `systemPrompt`: instructions for the agent
- `skills`: array of skill IDs the agent is allowed to use
- `maxIterations`: hard cap on tool call loops (default 10)
- `temperature`, `maxTokens`
- `memory`: none | conversation (keeps message history within the run) | summary (summarize older messages to save context)

The agent execution loop:
1. Build the initial message from `systemPrompt` + formatted input data.
2. Call the LLM with all enabled skills as tools.
3. If the response contains tool calls, execute each skill, collect results.
4. Append tool results to the message history and call the LLM again.
5. Repeat until no more tool calls or `maxIterations` is reached.
6. Return the final text response as the node output.

### 5.2 — Built-in Agent Skills

Implement each as a class implementing `IAgentSkill`:

**web_search** — Search the web using Brave Search API or SerpAPI. Input: `query` (string), `numResults` (1-10). Output: array of `{ title, url, snippet }`. Requires an API key stored in credentials.

**web_scrape** — Fetch and extract content from a URL. Input: `url`, `selector` (optional CSS selector to extract specific content), `waitForSelector` (optional). Output: `{ title, text, html, links[] }`. Use `playwright` in headless mode for JS-heavy pages, `node-fetch` + `cheerio` for simple pages.

**read_file** — Read a file from the local filesystem. Input: `path`, `encoding`. Output: `{ content, size, mtime }`. Restricted to paths within the configured `WORKSPACE_DIR` env var only.

**write_file** — Write content to a file. Input: `path`, `content`, `mode` (overwrite or append). Restricted to `WORKSPACE_DIR`.

**list_directory** — List files in a directory. Input: `path`, `recursive` (boolean). Output: array of file/dir metadata.

**run_code** — Execute code in a sandboxed environment. Input: `language` (javascript, python), `code`, `timeout` (seconds). Output: `{ stdout, stderr, exitCode, result }`. Use `vm2` for JS. Use a Docker `python:3.12-slim` container via Dockerode for Python — this is important for security, never execute Python directly on the host.

**http_request** — Make an HTTP request. Input: `method`, `url`, `headers`, `body`, `timeout`. Output: `{ status, headers, body }`. Same as the HTTP connector but callable by agents inline.

**image_analysis** — Analyze an image using a vision model. Input: `imageUrl` or `imageBase64`, `prompt`. Uses the configured vision model (GPT-4o vision, Claude claude-sonnet-4-20250514, or Gemini). Output: `{ description, analysis }`.

**extract_structured_data** — Given unstructured text and a JSON schema, extract structured data using an LLM. Input: `text`, `schema` (JSON Schema object), `instructions`. Output: structured object matching the schema.

**send_email** (via connected credential) — Send an email. Input: `to`, `subject`, `body`, `credentialId`. Uses the Gmail or SMTP connector internally.

**database_query** — Execute a read-only SQL query against a connected database credential. Input: `credentialId`, `query`, `params`. Output: `{ rows, rowCount }`.

**calculate** — Evaluate a mathematical expression safely. Input: `expression` (string). Output: `{ result }`. Use `mathjs` — never `eval`.

**format_date** — Parse and format date strings. Input: `date`, `inputFormat`, `outputFormat`, `timezone`. Uses `date-fns`.

**generate_image** — Generate an image from a text prompt. Input: `prompt`, `model` (dall-e-3, stable-diffusion, etc.), `size`, `style`. Output: `{ imageUrl, base64 }`.

**text_to_speech** — Convert text to audio. Input: `text`, `voice`, `model`, `credentialId` (ElevenLabs or OpenAI). Output: `{ audioBase64, durationSeconds }`.

**summarize** — Summarize long text. Input: `text`, `maxLength`, `format` (bullets or paragraph), `focus`. Output: `{ summary }`.

**translate** — Translate text. Input: `text`, `targetLanguage`, `sourceLanguage` (optional, auto-detect). Output: `{ translatedText, detectedSourceLanguage }`.

**memory_store** — Store a key-value pair in the run's persistent memory store (scoped to the workflow, persists across runs). Input: `key`, `value`, `ttlDays`.

**memory_retrieve** — Retrieve a value from the workflow memory store. Input: `key`. Output: `{ value, storedAt }`.

---

## PART 6 — FRONTEND CANVAS UI

### 6.1 — Canvas Architecture

Use `@xyflow/react` (React Flow) for the canvas. The canvas is the core of the UI — every workflow is built by dragging nodes onto the canvas and connecting them.

Canvas must support:
- Drag nodes from a sidebar panel onto the canvas.
- Click a node to open its config panel in a right drawer.
- Connect nodes by dragging from an output handle to an input handle.
- Nodes with conditional outputs (IF node, Switch node) must show multiple labeled output handles.
- Right-click context menu on canvas: add node, paste node.
- Right-click on node: duplicate, delete, disable, view last output.
- Keyboard shortcuts: `Del` or `Backspace` to delete selected nodes/edges, `Cmd+C` / `Cmd+V` to copy/paste nodes, `Cmd+Z` / `Cmd+Y` for undo/redo, `Cmd+A` to select all, `Cmd+S` to save.
- Minimap in bottom right.
- Fit-to-view button.
- Zoom controls.
- Node groups / sticky notes for annotation.

### 6.2 — Node Visual Design

Each node on the canvas must display:
- Connector icon + color (each connector category has a distinct brand color).
- Node name (editable on double-click).
- Operation name below node name.
- Status indicator dot: grey (never run), green (last run succeeded), red (last run failed), yellow (running).
- On hover: show a "Run this node" button and "View last output" button.
- Execution time badge when in execution view mode.

### 6.3 — Node Config Panel (right drawer)

When a node is clicked, open a right-side drawer showing:

- **Header**: connector icon, connector name, operation selector dropdown.
- **Credential selector**: dropdown to select or add a credential for this connector. Show connection status indicator.
- **Parameters section**: render each `IField` from the operation's `fields` definition. Support field types: text input, textarea, number, toggle, select (static or dynamic — dynamic fields fetch options from the connector's `getDynamicOptions` method), date picker, code editor (monaco), JSON editor, file upload, multi-select tags.
- **Expression mode toggle**: next to every field, a `{{ }}` button to switch from static value to expression mode, where the user can type `{{ $node.NodeName.output.fieldName }}` to reference upstream data.
- **Input/Output preview**: at the bottom, show the last input and output for this node (from the most recent run).
- **Notes tab**: free text notes attached to this node.

### 6.4 — Execution UI

Add a toggle: "Edit mode" / "Execution mode". In execution mode:
- Show the run history panel on the left sidebar.
- Each node shows its execution status from the selected run.
- Clicking a node in execution mode shows the actual input and output data from that run.
- The execution log panel at the bottom streams real-time logs via socket.io during an active run.
- Each log line shows: timestamp, node name, level (info/error/debug), message.

### 6.5 — Connector / App Store UI

The "Add node" sidebar must have:
- A search bar that searches all connectors and operations by name.
- Category tabs: All, Communication, Productivity, Developer, Data, Finance, AI, Utility.
- Each connector card shows: icon, name, number of available operations, auth type badge.
- Clicking a connector expands to show all operations. Clicking an operation adds a node for it to the canvas.
- A "Connected" badge on connectors that the user already has credentials for.

### 6.6 — Credentials Manager

A dedicated `/credentials` page (not just a modal) with:
- List all stored credentials: name, connector, created date, last used date, masked key preview.
- Add credential button → opens a modal with the connector's auth flow (API key form, or OAuth2 button that opens the OAuth popup).
- For OAuth2 credentials, show connection status and a "Reconnect" button if the token is expired.
- Delete credential (with warning if the credential is used in active workflows).
- Test connection button for each credential.

### 6.7 — Workflow Management

`/workflows` page:
- List all workflows: name, last modified, last run status, last run time, trigger type badge, enabled/disabled toggle.
- Create workflow button → opens canvas with a default trigger node.
- Search and filter workflows.
- Bulk actions: delete, duplicate, export (as JSON), import (from JSON file).

`/workflows/:id/runs` page:
- List all runs: status badge, start time, duration, trigger source.
- Click a run → opens the execution mode canvas view for that specific run.

### 6.8 — Dashboard

`/` root page:
- Summary cards: total workflows, runs today, success rate (last 7 days), active webhooks.
- Recent runs table.
- Quick actions: create workflow, browse connectors, view credentials.

---

## PART 7 — API DESIGN

All API routes are prefixed `/api/v1/`. All routes except `/api/v1/auth/*` require a JWT Bearer token.

Implement the following route groups:

`/auth` — register, login, refresh, logout, me (get current user).

`/workflows` — CRUD for workflows, plus: `POST /:id/activate`, `POST /:id/deactivate`, `POST /:id/run` (manual trigger), `POST /:id/duplicate`, `GET /:id/runs`, `GET /export/:id`, `POST /import`.

`/runs` — `GET /:id` (run detail with all node executions), `POST /:id/cancel`, `GET /:id/logs` (stream via SSE or return all logs).

`/credentials` — CRUD, plus `POST /:id/test` (test connection).

`/connectors` — `GET /` (list all available connectors with metadata), `GET /:id` (connector detail with all operations and field schemas), `GET /:connectorId/:operationId/dynamic-options` (fetch dynamic select options for a field).

`/mcp-servers` — CRUD, plus `POST /:id/connect`, `POST /:id/disconnect`, `GET /:id/tools`, `POST /:id/call-tool`.

`/webhooks/:workflowId/:secret` — public endpoint (no auth), POST triggers a workflow run.

`/health` — returns `{ status: 'ok', version, uptime, dbStatus }`.

---

## PART 8 — DATABASE SCHEMA

Create these tables in SQLite using a migration file:

`users` — id, email, password_hash, created_at, updated_at.

`workflows` — id, user_id, name, description, definition (JSON — the full canvas graph), is_active, trigger_type, trigger_config (JSON), created_at, updated_at.

`workflow_runs` — id, workflow_id, user_id, status, trigger_source, trigger_data (JSON), started_at, completed_at, duration_ms, error.

`node_executions` — id, run_id, node_id, node_name, status, input (JSON), output (JSON), error, started_at, completed_at, duration_ms.

`run_logs` — id, run_id, node_id (nullable), level, message, data (JSON), created_at.

`credentials` — id, user_id, connector_id, name, data (JSON — encrypted with AES-256-GCM using `ENCRYPTION_KEY` env var), auth_type, created_at, updated_at, last_used_at, last_tested_at, test_status.

`mcp_servers` — id, user_id, name, url, transport, status, tools (JSON), created_at, updated_at, last_ping_at.

`workflow_variables` — id, workflow_id, key, value (JSON), ttl_expires_at, created_at, updated_at.

`webhook_events` — id, workflow_id, payload (JSON), headers (JSON), triggered_run_id, received_at.

**IMPORTANT**: All credential data must be encrypted at rest. The `credentials.data` field must be encrypted with AES-256-GCM before write and decrypted on read. Use Node's built-in `crypto` module. The encryption key comes from `ENCRYPTION_KEY` env var (32 bytes, base64-encoded). If the key is missing, the server must refuse to start with a clear error message.

---

## PART 9 — SECURITY REQUIREMENTS

These are non-negotiable for production:

- All credential data AES-256-GCM encrypted at rest (see Part 8).
- JWT tokens expire in 15 minutes. Refresh tokens expire in 7 days. Refresh tokens are stored in the database and can be revoked.
- All user inputs that become part of expressions or code must be sanitized. The expression evaluator must run in a sandboxed scope with no access to `process`, `require`, `globalThis`, `eval`, or `Function`.
- Webhook secrets must be at least 32 characters of random hex. Validate incoming webhook signatures using `crypto.timingSafeEqual` to prevent timing attacks.
- Stripe and other payment webhooks must validate the provider's signature before processing.
- All API routes must validate request body with zod. Validation errors return 400 with field-level details.
- Rate limiting: 200 req/15min globally, 20 req/min on run endpoints, 5 req/min on auth endpoints.
- HTTP security headers via `helmet` middleware.
- OAuth2 state parameter must be a random nonce stored in the session, verified on callback.
- All database queries must use parameterized queries — no string interpolation in SQL.

---

## PART 10 — IMPLEMENTATION ORDER

Execute in this exact order:

1. Database setup — schema, migrations, SQLite connection singleton.
2. Auth system — register, login, JWT middleware.
3. Core interfaces — `IConnector`, `IOperation`, `IAgentSkill`, `ExecutionContext`.
4. Base connector class — abstract class implementing common patterns (retry, rate limiting, error normalization) that all connectors extend.
5. Credential system — CRUD with encryption.
6. Workflow CRUD — store and retrieve workflow definitions.
7. Workflow engine — DAG parser, execution loop, run lifecycle, database persistence.
8. Webhook + schedule triggers.
9. First 5 connectors — HTTP, Code, Transform, Gmail, Slack. Validate the architecture end-to-end.
10. Remaining connectors — batch by category, test each before moving to the next.
11. MCP registry and MCP node type.
12. Agent node with skill system.
13. Real-time log streaming via socket.io.
14. Frontend canvas — React Flow setup, node rendering, basic connection.
15. Node config panel — field rendering, expression mode.
16. Credentials manager page.
17. Workflow management page.
18. Execution mode and run history.
19. App store / connector browser UI.
20. Dashboard.
21. Production hardening (from the audit — Phases 1 and 2) applied on top of all of the above.

---

## FINAL REQUIREMENT

Every connector's `execute()` method must be independently testable — it must not depend on Express, the database, or the socket.io instance. It takes a validated input, a credential, and an execution context. That's it. This makes the connector library portable and testable without spinning up the full server.

Never hardcode credentials, API endpoints, or service URLs. Every external URL must come from a constant in a `constants.ts` file per connector, or from an environment variable for things that vary by deployment.

Write `README.md` entries for every connector under `docs/connectors/` documenting required scopes, required credential fields, and one example use case per operation.

-