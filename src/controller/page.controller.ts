import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Request, Response, Headers, Next, HttpStatus } from '@nestjs/common'
import Express, { NextFunction } from 'express'
import { Page } from 'src/resource/database/entity/Page.entity'
import { Record } from 'src/resource/database/entity/Record.entity'
import { getDatabaseClient } from 'src/resource/database/main'
import { Exception } from 'src/resource/plugin/error.plugin'
import googlePlugin from 'src/resource/plugin/google.plugin'
import utilityPlugin from 'src/resource/plugin/utility.plugin'

@Controller()
export class PageController {
    constructor (  ) {

    }

    @Get('v0/page/:pageId')
    async getPage (@Request() _request: Express.Request, @Param('pageId') _pageId: string, @Response() _response: Express.Response, @Next() _next: Express.NextFunction) {
        try {
            utilityPlugin.validateUUID(_pageId)
        } catch(_error) { return _next(new Exception(_request, 'Invalid page id.', HttpStatus.BAD_REQUEST)) }
        const _pages = await getDatabaseClient().manager.getRepository(Page).find({ where: { uuid: utilityPlugin.validateUUID(_pageId), is_active: true } })
        if(_pages.length !== 1) return _next(new Exception(_request, 'Wrong page id.', HttpStatus.BAD_REQUEST))

        return _response.status(200).json({ success: true, data: {
            title: _pages[0].title,
            description: _pages[0].description,
            filtering: _pages[0].filtering,
            option: Object.keys(_pages[0].datas).sort((_previous, _current) => { return (_pages[0].data_order ?? [  ]).indexOf(_previous) - (_pages[0].data_order ?? [  ]).indexOf(_current) }).map(_option => {
                return {
                    name: _pages[0].datas[_option].name,
                    code: _option
                }
            })
        }, error: null, requested_at: new Date().toISOString() })
    }

    @Get('v0/page/:pageId/data')
    async getData (@Request() _request: Express.Request, @Param('pageId') _pageId: string, @Response() _response: Express.Response, @Next() _next: Express.NextFunction) {
        try {
            utilityPlugin.validateUUID(_pageId)
        } catch(_error) { return _next(new Exception(_request, 'Invalid page id.', HttpStatus.BAD_REQUEST)) }
        const _pages = await getDatabaseClient().manager.getRepository(Page).find({ where: { uuid: utilityPlugin.validateUUID(_pageId), is_active: true } })
        if(_pages.length !== 1) return _next(new Exception(_request, 'Wrong page id.', HttpStatus.BAD_REQUEST))

        const _records = await getDatabaseClient().manager.getRepository(Record).find({ where: { page_id: _pages[0].uuid, is_active: true }, order: { srl: 'desc' } })
        let _data = _records.length >= 1 ? _records[0].data : undefined
        if(_records.length < 1) {
            const _result = await googlePlugin.Page.fetchData(_pages[0].uuid)
            if(_result.success == false) return _next(new Exception(_request, 'Failed to fetch data.', HttpStatus.INTERNAL_SERVER_ERROR, _result.error))
            const _Record = new Record()
            _Record.data = _result.data
            _Record.page_id = _pages[0].uuid
            const _record = await getDatabaseClient().manager.save(_Record)
            _data = _record.data
        }

        return _response.status(200).json({ success: true, data: _data, error: null, requested_at: new Date().toISOString() })
    }

    @Post('v0/page')
    async newPage (@Request() _request: Express.Request, @Body() _body: {
        title: string,
        description: string,
        spreadsheet_id: string,
        filtering: Array<{ name: string, condition: { name: string, value: string } }>,
        datas: { [ data in string ]: { name: string } },
        data_order: Array<string>,
        sheets: { [ name in string ]: { zone: string, datas: { [ data in string ]: string } } },
        interval: number
    }, @Response() _response: Express.Response, @Next() _next: Express.NextFunction) {
        const _Page = new Page()
        _Page.title = _body.title
        _Page.description = _body.description
        _Page.spreadsheet_id = _body.spreadsheet_id
        _Page.filtering = _body.filtering
        _Page.datas = _body.datas
        _Page.data_order = _body.data_order
        _Page.sheets = _body.sheets
        _Page.interval = _body.interval

        const _page = await getDatabaseClient().manager.save(_Page)

        return _response.status(200).json({ success: true, data: { id: _page.uuid }, error: null, requested_at: new Date().toISOString() })
    }
}
