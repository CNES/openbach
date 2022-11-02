

import os
import itertools
import tempfile
import argparse

import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime,timedelta
from openpyxl import Workbook
from openpyxl.worksheet.table import Table, TableStyleInfo
from dateutil.parser import parse

#import collect_agent
from data_access.post_processing import Statistics, save, _Plot


def aggregator_factory(mapping):
    def aggregator(pd_datetime):
      for moment, interval in mapping.items():
         if pd_datetime in interval:
            return moment
      return 'undefined'
    return aggregator

AGGREGATION_OPTIONS = {'year', 'month', 'day', 'hour'}

def main(
        agent_name,job_name, statistics_names, aggregations_periods,
         begin_date,end_date,reference,compute_median,compute_mean, stats_with_suffixes):

    file_ext='xlsx'
    #statistics = Statistics.from_default_collector()
    statistics=Statistics('172.20.34.80')
    statistics.origin = 0
    with tempfile.TemporaryDirectory(prefix='openbach-summary_time_period-') as root:

        wb=Workbook() 
        for agent,job,fields,aggregation,begin_date,end_date,reference in itertools.zip_longest(
            agent_name,job_name, statistics_names,aggregations_periods,begin_date,end_date,reference,
             fillvalue=[]):

             if len(begin_date) > 1 :
                begin_date=' '.join(begin_date)
             if len(end_date) > 1:
                end_date = ' '.join(end_date)

             if begin_date == end_date ==[]:
                timestamp=None
             else:
                begin_date=parse(begin_date)
                end_date=parse(end_date)
                timestamp=[int(datetime.timestamp(begin_date)*1000),int(datetime.timestamp(end_date)*1000)]
              
             data_collection = statistics.fetch(
                    job=job,agent=agent,
                    suffix = None if stats_with_suffixes else '',
                    fields=fields,timestamps=timestamp)

             metadata = itertools.zip_longest(agent,job,fields,aggregation)
             
             for agent,job,field ,aggregation in metadata:
                
                for data in data_collection:
                
                        df=data.dataframe
                        df.index = pd.to_datetime(df.index,unit='ms')
                        
                        end=len(df.index)
                        df_date=pd.DataFrame({'DateTime':df.index})
                       
                        #print(list(groups))
                        if field not in df.columns.get_level_values('statistic'):
                                message = 'job {} did not produce the statistic {}'.format(job, field)
                                #collect_agent.send_log(syslog.LOG_WARNING, message)
                                print(message)
                                continue
                        l_date=set()
                        for date in df_date['DateTime'].dt.date:
                                l_date.add(date)


                        ws_name=list(df.columns.get_level_values('job'))
                        ws=wb.create_sheet(title='job_id_{}'.format(str(ws_name[0])))
                        ws.row_dimensions[1].height = 30
                        ws.append([field.upper(),'Mean','Median'])
                        for item in l_date:     
                                                              
                                journey=pd.Interval(pd.Timestamp('{} 07:00:00'.format(item)), pd.Timestamp('{} 18:00:00'.format(item)))
                                evening=pd.Interval(pd.Timestamp('{} 18:00:00'.format(item)), pd.Timestamp('{} 00:00:00'.format(item+timedelta(days=1))))
                                night=pd.Interval(pd.Timestamp('{} 00:00:00'.format(item+timedelta(days=1))), pd.Timestamp('{} 07:00:00'.format(item+timedelta(days=1))))

                                mapping={'Journey':journey,'Evening':evening,'Night':night}
                        
                        for _,column in df.items():
                               
                                if aggregation is None:
                                        mean=column.mean()
                                        median=column.median()
                                        periode='{} à {}'.format(column.index[0],column.index[end-1])
                                        row=[periode,mean,median]
                                        ws.append(row)
                                        filepath='/home/agarba-abdou/summary_time_period_{}_noAggregation.{}'.format(field,file_ext)
                                else:
                               
                                        groups=column.groupby(aggregator_factory(mapping))
                                        for group in groups:
                                                print(group)
                                        means=list(groups.mean())
                                        medians=list(groups.median())       
                                        index=list(groups.mean().index)
                                        
                                        for (index, mean ,median) in  zip(index,means,medians):
                                            periode=index
                                            row=[periode,mean,median]
                                            ws.append(row)
                                        filepath='/home/agarba-abdou/summary_time_period_{}.{}'.format(field,file_ext)

                        """tab=Table(displayName=str(ws_name),ref='A1:E5')
                        style = TableStyleInfo(name="TableStyleMedium9", showFirstColumn=False,
                                showLastColumn=False, showRowStripes=True, showColumnStripes=True)
                        tab.tableStyleInfo = style"""
                        
                del wb['Sheet']      
                #filepath = os.path.join(root, '{}_{}.{}'.format(agent,field, file_ext))
                wb.save(filepath)


if __name__ == '__main__':
    #with collect_agent.use_configuration('/opt/openbach/agent/jobs/temporal_binning_histogram/temporal_binning_histogram_rstats_filter.conf'):
        parser = argparse.ArgumentParser(description=__doc__)
        parser.add_argument(
                '-n', '--agent', metavar='AGENT_NAME', nargs='+', action='append',dest='agents',
                required=True, type=str, default=[],
                help='Agent name to fetch data from')
        parser.add_argument(
                '-j', '--jobs', metavar='JOB_NAME', nargs='+', action='append',
                required=True, type=str, default=[],dest='jobs',
                help='job name to fetch data from')
        parser.add_argument(
                '-s', '--stat', '--statistic', dest='statistics',
                metavar='STATISTIC', nargs='+', action='append', default=[],
                help='statistics names to be analysed')
        parser.add_argument(
                '-a', '--aggregation', dest='aggregations',
                choices=AGGREGATION_OPTIONS, nargs='+', action='append',default=[],
                help='Time criteria for values aggregation')
        parser.add_argument(
                '-b', '--begin-date',metavar='BIGIN_DATE',nargs='+' ,dest='begin_date',
                default=[],help='Start date in form YYYY:MM:DD hh:mm:ss', action='append')
        parser.add_argument(
                '-e', '--end-date',metavar='END_DATE',nargs='+' ,dest='end_date',
                default=[],help='End date in form YYYY:MM:DD hh:mm:ss', action='append')
        parser.add_argument(
                '-r', '--reference',metavar='REFERENCE',nargs='+' ,dest='reference',
                default=[],help='Reference value for comparison', action='append')
        
        parser.add_argument(
                '-w', '--no-suffix', action='store_true',
                help='Do not plot statistics with suffixes')
        parser.add_argument(
                '--no_median',help='Do not compute median', action='store_true')
        parser.add_argument(
                '--no_mean',help='Do not compute mean', action='store_true')

        args = parser.parse_args()
        compute_median = not args.no_median
        compute_mean = not args.no_mean
        stats_with_suffixes = not args.no_suffix
        

        main(
            args.agents,args.jobs, args.statistics, args.aggregations,args.begin_date,args.end_date,args.reference ,compute_median,compute_mean,stats_with_suffixes)
