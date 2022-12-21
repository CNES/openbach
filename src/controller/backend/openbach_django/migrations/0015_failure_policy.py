# Generated by Django 3.0 on 2022-11-03 15:29

from django.db import migrations, models
import django.db.models.deletion
import openbach_django.base_models


class Migration(migrations.Migration):

    dependencies = [
        ('openbach_django', '0014_pullfile_removes'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='jobinstance',
            name='is_stopped',
        ),
        migrations.RemoveField(
            model_name='openbachfunction',
            name='section',
        ),
        migrations.RemoveField(
            model_name='scenarioinstance',
            name='is_stopped',
        ),
        migrations.AddField(
            model_name='openbachfunctioninstance',
            name='retry_performed',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='jobargument',
            name='type',
            field=models.CharField(choices=[('int', 'INTEGER'), ('str', 'STRING'), ('float', 'FLOATING_POINT_NUMBER'), ('ip', 'IP_ADDRESS'), ('network', 'IP_NETWORK'), ('None', 'NONE_TYPE'), ('job', 'JOB_INSTANCE_ID'), ('scenario', 'SCENARIO_INSTANCE_ID')], default='None', max_length=10),
        ),
        migrations.AlterField(
            model_name='startjobinstanceargument',
            name='type',
            field=models.CharField(choices=[('int', 'INTEGER'), ('str', 'STRING'), ('float', 'FLOATING_POINT_NUMBER'), ('ip', 'IP_ADDRESS'), ('network', 'IP_NETWORK'), ('None', 'NONE_TYPE'), ('job', 'JOB_INSTANCE_ID'), ('scenario', 'SCENARIO_INSTANCE_ID')], max_length=10, null=True),
        ),
        migrations.CreateModel(
            name='FailurePolicy',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('policy', models.CharField(choices=[('I', 'Ignore'), ('F', 'Fail'), ('R', 'Retry')], default='I', max_length=1)),
                ('wait_time', openbach_django.base_models.OpenbachFunctionParameter(blank=True, null=True, type=float)),
                ('retry_limit', openbach_django.base_models.OpenbachFunctionParameter(blank=True, null=True, type=int)),
                ('openbach_function', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='on_failure', to='openbach_django.OpenbachFunction')),
            ],
        ),
    ]