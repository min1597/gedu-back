import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { AppController } from '../controller/main.controller'
import { AppService } from '../service/app.service'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'
import { typeOrmConfig } from 'src/resource/config/typeorm.config'
import { ConfigModule } from '@nestjs/config'
import { TokenModule } from './token.module'
import { RequestMiddleware } from 'src/middleware/request.middleware'
import { UserModule } from './user.module'
import { PageModule } from './page.module'

@Module({
  imports: [ ConfigModule.forRoot({ isGlobal: true }), TypeOrmModule.forRoot(typeOrmConfig as TypeOrmModuleOptions), TokenModule, UserModule, PageModule ],
  controllers: [ AppController ],
  providers: [ AppService ],
})
export class AppModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {
    _consumer
      .apply(RequestMiddleware)
      .forRoutes('*')
  }
}
