import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { UserController } from 'src/controller/user.controller'
import internalAuthorizedMiddleware from 'src/middleware/internal.authorized.middleware'
import { EntityManager } from 'typeorm'

@Module({
    imports: [  ],
    controllers: [ UserController ],
    providers: [ EntityManager ],
})

export class UserModule implements NestModule {
    configure(_consumer: MiddlewareConsumer) {
        _consumer
            .apply(internalAuthorizedMiddleware)
            .forRoutes(UserController)
    }
}
  