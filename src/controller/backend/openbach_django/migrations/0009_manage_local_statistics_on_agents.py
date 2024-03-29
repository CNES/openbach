# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2020-10-16 08:52
from __future__ import unicode_literals

from django.db import migrations, models
import openbach_django.base_models


class Migration(migrations.Migration):

    dependencies = [
        ('openbach_django', '0008_setstatisticspolicyjob_config_file'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='setstatisticspolicyjob',
            name='date',
        ),
        migrations.AddField(
            model_name='installedjob',
            name='default_stat_local',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='setstatisticspolicyjob',
            name='local',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=bool),
        ),
        migrations.AddField(
            model_name='statisticinstance',
            name='local',
            field=models.BooleanField(default=True),
        ),
    ]
