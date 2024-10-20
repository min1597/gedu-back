import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'
import { getDatabaseClient } from '../database/main'
import { Page } from '../database/entity/Page.entity'
import googlePlugin from './google.plugin'

const _serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY,
    scopes: [ 'https://www.googleapis.com/auth/spreadsheets' ]
})
function columnToNumber (_column: string) {
    let _result = 0
    for (let _index = 0; _index < _column.length; _index++) {
        _result = _result * 26 + (_column.charCodeAt(_index) - 'A'.charCodeAt(0) + 1)
    }
    return _result
}
function numberToColumn (_number: number) {
    let _column = ''
    while (_number > 0) {
        let _remainder = (_number - 1) % 26
        _column = String.fromCharCode(_remainder + 'A'.charCodeAt(0)) + _column
        _number = Math.floor((_number - 1) / 26)
    }
    return _column
}


export default {
    pluginName: 'googlePlugin',


    Spreadsheet: {
        getDocument: async (_code: string): Promise<
            {
                success: true,
                spreadsheet: GoogleSpreadsheet
            }
            | { success: false, error?: Error }
        > => {
            try {
                const _document = new GoogleSpreadsheet(_code, _serviceAccountAuth)
                await _document.loadInfo()
                return { success: true, spreadsheet: _document }
            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
        },
        getSheet: async (_document: GoogleSpreadsheet, _sheetName: string): Promise<
            { success: true, sheet: GoogleSpreadsheetWorksheet }
            | { success: false, error?: Error }
        > => {
            try {
                if(_document.sheetsByTitle[_sheetName] instanceof GoogleSpreadsheetWorksheet == false) return { success: false, error: new Error('Failed to fetch sheet.') }
                return { success: true, sheet: _document.sheetsByTitle[_sheetName] }
            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
        },
        cellToArray: async (_sheet: GoogleSpreadsheetWorksheet, _startCell: string, _endCell: string): Promise<
            { success: true, data: Array<Array<string>> }
            | { success: false, error?: Error }
        > => {
            try {
                const _cellRegex = /[A-Z]+[0-9]+/
                if([ _cellRegex.test(_startCell), _cellRegex.test(_endCell) ].includes(false) == true) return { success: false, error: new Error('Invalid cell.') }

                const _result = [  ]
                for(let _column = columnToNumber(_startCell.match(/[A-Z]+/g)[0]); _column <= columnToNumber(_endCell.match(/[A-Z]+/g)[0]); _column ++) {
                    const _values = [  ]
                    for(let _row = Number(_startCell.match(/[0-9]+/g)[0]); _row <= Number(_endCell.match(/[0-9]+/g)[0]); _row ++) {
                        _values.push(_sheet.getCellByA1(`${ numberToColumn(_column) }${ _row }`))
                    }
                    _result.push(_values)
                }
                return { success: true, data: _result }
            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
        }
    },
    Page: {
        fetchData: async (_id: string & { __brand: 'UUID' }): Promise<
            { success: true, data: Array<{ [ key in string ]: string }> }
            | { success: false, error?: Error }
        > => {
            try {
                const _pages = await getDatabaseClient().manager.getRepository(Page).find({ where: { uuid: _id, is_active: true } })
                if(_pages.length !== 1) return { success: false, error: new Error('Wrong page id.') }

                const _document = await googlePlugin.Spreadsheet.getDocument(_pages[0].spreadsheet_id)
                if(_document.success == false) return { success: false, error: new Error('Failed to fetch document.', { cause: _document.error }) }
                const _datas = await Promise.all(Object.keys(_pages[0].sheets).map(async _sheetName => {
                    const _rows = _pages[0].sheets[_sheetName].zone
                    const _columns = Object.values(_pages[0].sheets[_sheetName].datas).map(_data => columnToNumber(_data.match(/[A-Z]+/g)[0]))
                    const _maximum = _columns.reduce((_previous, _current) => {
                        return _previous > _current ? _previous : _current
                    })
                    const _minimum = _columns.reduce((_previous, _current) => {
                        return _previous > _current ? _current : _previous
                    })
                    const _sheet = _document.spreadsheet.sheetsByTitle[_sheetName]
                    await _sheet.loadCells(`${ numberToColumn(_minimum) }${ _pages[0].sheets[_sheetName].zone.split(':')[0] }:${ numberToColumn(_maximum) }${ _pages[0].sheets[_sheetName].zone.split(':')[1] }`)
                    const _datas: Array<{ [ dataName in string ]: string }> = [  ]
                    for(let _index = Number(_pages[0].sheets[_sheetName].zone.split(':')[0]); _index <= Number(_pages[0].sheets[_sheetName].zone.split(':')[1]); _index ++) {
                        const _data: { [ dataName in string ]: string } = {  }
                        for(const _dataName of Object.keys(_pages[0].datas)) {
                            _data[_dataName] = _pages[0].sheets[_sheetName].datas[_dataName] ? String(_sheet.getCellByA1(`${ _pages[0].sheets[_sheetName].datas[_dataName] }${ _index }`).value ?? '-') : '-'
                        }
                        _datas.push(_data)
                    }
                    return _datas
                }))
                return { success: true, data: _datas.flat() }
            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
        }
    }
}