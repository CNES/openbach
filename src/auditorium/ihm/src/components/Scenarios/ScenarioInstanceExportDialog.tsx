import React from 'react';

import Checkbox from '@mui/material/Checkbox';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import type {IFilesCount} from '../../utils/interfaces';


const ScenarioInstanceExportDialog: React.FC<Props> = (props) => {
    const {files, onChange} = props;
    const [rows, storeRows] = React.useState<Row[]>(
        Object.entries(files).reduce(
            (accumulator, [jobName, counts]) => accumulator.concat(Object.entries(counts).map(
                ([statName, count]) => [false, jobName, statName, count]
            )),
            [] as Row[],
        )
    );

    const handleSelectAll = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const selected = event.target.checked;
        storeRows((rows: Row[]) => rows.map(
            ([s, jobName, statName, count]: Row) => [selected, jobName, statName, count]
        ));
    }, []);

    const handleClick = React.useCallback((index: number) => (event: React.MouseEvent<unknown>) => {
        storeRows((rows: Row[]) => rows.map(([s, j, n, c]: Row, i: number) => [i === index ? !s : s, j, n, c]));
    }, []);

    React.useEffect(() => {
        onChange(rows);
    }, [rows, onChange]);

    const numSelected = rows.reduce((total: number, row: Row) => row[0] ? total + 1 : total, 0);

    return (
        <TableContainer>
            <Table size="medium">
                <TableHead>
                    <TableRow>
                        <TableCell padding="checkbox">
                            <Checkbox
                                color="primary"
                                indeterminate={numSelected > 0 && numSelected < rows.length}
                                checked={rows.length > 0 && numSelected === rows.length}
                                onChange={handleSelectAll}
                            />
                        </TableCell>
                        <TableCell>Job Name</TableCell>
                        <TableCell>File</TableCell>
                        <TableCell>Amount</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map(([selected, jobName, statName, count]: Row, index: number) => (
                        <TableRow
                            key={index}
                            hover
                            onClick={handleClick(index)}
                            role="checkbox"
                            tabIndex={-1}
                            selected={selected}
                            sx={{cursor: "pointer"}}
                        >
                            <TableCell padding="checkbox">
                                <Checkbox color="primary" checked={selected} />
                            </TableCell>
                            <TableCell>{jobName}</TableCell>
                            <TableCell>{statName}</TableCell>
                            <TableCell>{count}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};


interface Props {
    files: IFilesCount;
    onChange: (rows: Row[]) => void;
}


type Row = [boolean, string, string, number];


export default ScenarioInstanceExportDialog;
