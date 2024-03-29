# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2020-04-01 08:51
from __future__ import unicode_literals

from django.db import migrations
import openbach_django.base_models


class Migration(migrations.Migration):

    dependencies = [
        ('openbach_django', '0006_upgrade_push_file'),
    ]

    operations = [
        migrations.AlterField(
            model_name='assigncollector',
            name='address',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='assigncollector',
            name='collector',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='if',
            name='functions_false',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=list),
        ),
        migrations.AlterField(
            model_name='if',
            name='functions_true',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=list),
        ),
        migrations.AlterField(
            model_name='installagent',
            name='address',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='installagent',
            name='collector',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='installagent',
            name='name',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='installagent',
            name='password',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='installagent',
            name='username',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='listjobinstances',
            name='addresses',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=list),
        ),
        migrations.AlterField(
            model_name='listjobinstances',
            name='update',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=bool),
        ),
        migrations.AlterField(
            model_name='openbachfunction',
            name='wait_time',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=float),
        ),
        migrations.AlterField(
            model_name='operanddatabase',
            name='attribute',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='operanddatabase',
            name='key',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='operanddatabase',
            name='name',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='operandstatistic',
            name='agent_address',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='operandstatistic',
            name='field',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='operandstatistic',
            name='job_name',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='operandvalue',
            name='value',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='pushfile',
            name='entity_name',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='pushfile',
            name='groups',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=list),
        ),
        migrations.AlterField(
            model_name='pushfile',
            name='local_path',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=list),
        ),
        migrations.AlterField(
            model_name='pushfile',
            name='remote_path',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=list),
        ),
        migrations.AlterField(
            model_name='pushfile',
            name='users',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=list),
        ),
        migrations.AlterField(
            model_name='restartjobinstance',
            name='date',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='restartjobinstance',
            name='instance_args',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=dict),
        ),
        migrations.AlterField(
            model_name='restartjobinstance',
            name='instance_id',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=int),
        ),
        migrations.AlterField(
            model_name='restartjobinstance',
            name='interval',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=int),
        ),
        migrations.AlterField(
            model_name='setlogseverityjob',
            name='address',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='setlogseverityjob',
            name='date',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='setlogseverityjob',
            name='job_name',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='setlogseverityjob',
            name='local_severity',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=int),
        ),
        migrations.AlterField(
            model_name='setlogseverityjob',
            name='severity',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=int),
        ),
        migrations.AlterField(
            model_name='setstatisticspolicyjob',
            name='address',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='setstatisticspolicyjob',
            name='broadcast',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=bool),
        ),
        migrations.AlterField(
            model_name='setstatisticspolicyjob',
            name='date',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='setstatisticspolicyjob',
            name='job_name',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='setstatisticspolicyjob',
            name='stat_name',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='setstatisticspolicyjob',
            name='storage',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=bool),
        ),
        migrations.AlterField(
            model_name='startjobinstance',
            name='entity_name',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='startjobinstance',
            name='interval',
            field=openbach_django.base_models.OpenbachFunctionParameter(null=True, type=int),
        ),
        migrations.AlterField(
            model_name='startjobinstance',
            name='job_name',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='startjobinstance',
            name='offset',
            field=openbach_django.base_models.OpenbachFunctionParameter(null=True, type=float),
        ),
        migrations.AlterField(
            model_name='startjobinstanceargument',
            name='hierarchy',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=list),
        ),
        migrations.AlterField(
            model_name='startjobinstanceargument',
            name='value',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='startscenarioinstance',
            name='arguments',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=dict),
        ),
        migrations.AlterField(
            model_name='startscenarioinstance',
            name='scenario_name',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='statusjobinstance',
            name='instance_id',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=int),
        ),
        migrations.AlterField(
            model_name='statusjobinstance',
            name='update',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=bool),
        ),
        migrations.AlterField(
            model_name='stopjobinstance',
            name='openbach_function_id',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=int),
        ),
        migrations.AlterField(
            model_name='stopjobinstances',
            name='openbach_function_ids',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=[int]),
        ),
        migrations.AlterField(
            model_name='stopscenarioinstance',
            name='openbach_function_id',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=int),
        ),
        migrations.AlterField(
            model_name='uninstallagent',
            name='address',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=str),
        ),
        migrations.AlterField(
            model_name='while',
            name='functions_end',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=list),
        ),
        migrations.AlterField(
            model_name='while',
            name='functions_while',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=list),
        ),
    ]
