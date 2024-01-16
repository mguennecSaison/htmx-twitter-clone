htmx.defineExtension('redirect-ws', {
    onEvent: function(name, event) {
        if (name === 'htmx:wsAfterMessage' && event.detail.message?.startsWith('{')) {
            const message = JSON.parse(event.detail.message)
            const redirect = message?.HEADERS?.['HX-Redirect']
            if (redirect) {
                alert(`Redirecting to ${redirect}`)
                window.location.pathname = redirect
            }
        }
    }
});