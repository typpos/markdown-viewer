
md.detect = ({storage: {state}, inject}) => {

  var onwakeup = true

  var tab = (id, info, tab) => {
    if (info.status === 'loading') {
      // try
      chrome.scripting.executeScript({
        target: {tabId: id},
        func: () =>
          JSON.stringify({
            url: window.location.href,
            header: document.contentType,
            loaded: !!window.state,
          })
      }, (res) => {
        if (chrome.runtime.lastError) {
          // origin not allowed
          return
        }

        try {
          var win = JSON.parse(res[0].result)
        }
        catch (err) {
          // JSON parse error
          return
        }

        if (win.loaded) {
          // anchor
          return
        }

        if (detect(win.header, win.url)) {
          if (onwakeup && chrome.webRequest) {
            onwakeup = false
            chrome.tabs.reload(id)
          }
          else {
            inject(id)
          }
        }
      })
    }
  }

  var detect = (content, url) => {
    var location = new URL(url)

    var origin =
      state.origins[location.origin] ||
      state.origins[location.protocol + '//' + location.hostname] ||
      state.origins['*://' + location.host] ||
      state.origins['*://' + location.hostname] ||
      state.origins['*://*']

    return (
      (origin && origin.header && origin.path && origin.match && /\btext\/(?:(?:(?:x-)?markdown)|plain)\b/i.test(content) && new RegExp(origin.match).test(location.href)) ||
      (origin && origin.header && !origin.path && /\btext\/(?:(?:(?:x-)?markdown)|plain)\b/i.test(content)) ||
      (origin && origin.path && origin.match && !origin.header && new RegExp(origin.match).test(location.href))
        ? origin
        : undefined
    )
  }

  return {tab}
}
