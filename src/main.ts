import { NestFactory } from '@nestjs/core'
import { AppModule } from './module/app.module'
import * as dotenv from 'dotenv'
import { WsAdapter } from '@nestjs/platform-ws'
import { connectDatabase } from './resource/database/main'
import * as Express from 'express'
import { clients } from './gateway/websocket.gateway'
import intervalPlugin from './resource/plugin/interval.plugin'

dotenv.config()

async function bootstrap () {
  await connectDatabase()

  const app = await NestFactory.create(AppModule, { cors: { origin: '*', allowedHeaders: '*' } })
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true
  })
  app.useWebSocketAdapter(new WsAdapter(app)) 
  app.use(Express.json({ limit: '50mb' }))
  app.use(Express.urlencoded({ limit: '50mb', extended: true }))
  await app.listen(4000)

  function interval () {
    setTimeout(() => { intervalPlugin.interval().then(interval) }, 10000)
  }

  interval()
}
bootstrap()
