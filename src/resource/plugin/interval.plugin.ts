import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'
import { getDatabaseClient } from '../database/main'
import { Page } from '../database/entity/Page.entity'
import googlePlugin from './google.plugin'
import { Record } from '../database/entity/Record.entity'
import * as dayjs from 'dayjs'

export default {
    pluginName: 'intervalPlugin',


    interval: async (): Promise<void> => {
        try {
            const _pages = await getDatabaseClient().manager.getRepository(Page).find({ where: { is_active: true } })
            for(const _page of _pages) {
                const _records = await getDatabaseClient().manager.getRepository(Record).find({ where: { page_id: _page.uuid, is_active: true }, order: { srl: 'desc' } })
                if(_records.length !== 0 && dayjs(_records[0].created_date).add(_page.interval, 'seconds').diff() > 0) continue
                const _result = await googlePlugin.Page.fetchData(_page.uuid)
                if(_result.success == false) { console.log(_result.error); continue }
                const _Record = new Record()
                _Record.data = _result.data
                _Record.page_id = _page.uuid
                const _record = await getDatabaseClient().manager.save(_Record)
            }
        } catch(_error) { console.log(_error); return }
    }
}