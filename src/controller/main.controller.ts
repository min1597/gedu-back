import { Controller, Get, HttpException, Next, Request, Response } from '@nestjs/common'
import { AppService } from '../service/app.service'
import Express, { NextFunction } from 'express'
import { Exception } from 'src/resource/plugin/error.plugin'

@Controller()
export class AppController {
  constructor (private readonly _appService: AppService) {

  }

  @Get()
  getHello(@Request() _request: Express.Request, @Next() _next: NextFunction): void {
    _next(new Exception(_request, 'Test', 403, new Error('Failed to asdf', { cause: new Error('Caused Error') })))
  }
  @Get('asdf')
  getHello2(@Request() _request: Express.Request, @Response() _response: Express.Response, @Next() _next: NextFunction): void {
    
  }
}
