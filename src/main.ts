import '@fontsource-variable/golos-text/index.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())

app.mount('#app')
