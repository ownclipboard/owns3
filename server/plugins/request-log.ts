/**
 * Records every /api/v1 request (successful or not) in the request_logs table.
 * Handlers add path/size via setLogDetails(); status and errors are captured here.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    if (isLoggableRequest(event)) event.context.logStartedAt = Date.now()
  })

  nitroApp.hooks.hook('afterResponse', async (event) => {
    if (!isLoggableRequest(event)) return
    await writeRequestLog(event, getResponseStatus(event), null)
  })

  nitroApp.hooks.hook('error', async (error, { event }) => {
    if (!event || !isLoggableRequest(event)) return
    const status = (error as { statusCode?: number }).statusCode ?? 500
    await writeRequestLog(event, status, error.message || String(error))
  })
})
