import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class Page {
    @PrimaryGeneratedColumn('increment', { comment: 'Serial number' })
    srl: number

    @PrimaryGeneratedColumn('uuid', { comment: 'Row ID' })
    uuid: string & { __brand: 'UUID' }


    @Column({ type: 'varchar', length: 20, nullable: false, comment: 'Page title' })
    title: string

    @Column({ type: 'text', nullable: false, comment: 'Page description' })
    description: string

    @Column({ type: 'text', nullable: false, comment: 'Spreadsheet ID' })
    spreadsheet_id: string

    @Column({ type: 'jsonb', nullable: false, comment: 'Filtering options' })
    filtering: Array<{ name: string, condition: { name: string, value: string } }>

    @Column({ type: 'jsonb', nullable: false, comment: 'Datas' })
    datas: { [ data in string ]: { name: string } }

    @Column({ type: 'text', array: true, nullable: true, default: null, comment: 'Data order' })
    data_order: Array<string>

    @Column({ type: 'jsonb', nullable: false, comment: 'Datas' })
    sheets: { [ name in string ]: { zone: string, datas: { [ data in string ]: string } } }

    @Column({ type: 'int', nullable: false, default: 60, comment: 'Seconds' })
    interval: number


    @Column({ type: 'boolean', default: true, comment: 'Data validity' })
    is_active: boolean

    @CreateDateColumn({ type: 'timestamptz', comment: 'Creation date' })
    created_date: Date

    @UpdateDateColumn({ type: 'timestamptz', comment: 'Update date' })
    updated_date: Date

    @Column({ type: 'timestamptz', nullable: true, default: null, comment: 'Delete date' })
    deleted_date: Date | null
}
