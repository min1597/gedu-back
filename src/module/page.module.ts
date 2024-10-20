import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { PageController } from 'src/controller/page.controller'
import InternalMiddleware from 'src/middleware/internal.middleware'
import { EntityManager } from 'typeorm'

@Module({
    imports: [  ],
    controllers: [ PageController ],
    providers: [ EntityManager ],
})

export class PageModule implements NestModule {
    configure(_consumer: MiddlewareConsumer) {
        _consumer
            .apply(InternalMiddleware)
            .forRoutes(PageController)
    }
}
  