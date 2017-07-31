import React from 'react'
import ReactDOM from 'react-dom'

import queryString from 'query-string'

import App from './App'
import history from './history'
import router from './router'

const context = {
  insertCss: (...styles) => {
    const removeCss = styles.map(x => x._insertCss())
    return () => { removeCss.forEach(f => f()) }
  }
}

const container = document.getElementById('root')

let currentLocation = history.location

async function onLocationChange (location, action) {
  currentLocation = location

  try {
    const route = await router.resolve({
      path: location.pathname,
      query: queryString.parse(location.search),
      user: window.user
    })

    if (currentLocation.key !== location.key) return

    if (route.redirect) {
      history.replace(route.redirect)
      return
    }

    ReactDOM.render(
      <App context={context}>{ route.component }</App>,
      container
    )
  } catch (error) {
    console.error(error)
  }
}

history.listen(onLocationChange)
onLocationChange(currentLocation)
