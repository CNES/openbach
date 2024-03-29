# Generated by Django 3.0 on 2022-11-09 13:25

from django.db import migrations, models


AGENT_STATUSES = [
        ('U', 'Agent Unreachable'),
        ('R', 'Agent Reachable But Daemon Unavailable'),
        ('A', 'Available'),
        ('I', 'Installing'),
        ('F', 'Uninstall Failed'),
        ('D', 'Detach Failed'),
]
JOB_INSTANCE_STATUSES = [
        ('P', 'Scheduled'),
        ('R', 'Running'),
        ('E', 'Error'),
        ('S', 'Stopped'),
        ('U', 'Agent Unreachable'),
        ('NR', 'Not Running'),
        ('NS', 'Not Scheduled'),
        ('?', 'Unknown'),
]
OPENBACH_FUNCTION_INSTANCE_STATUSES = [
        ('P', 'Scheduled'),
        ('R', 'Running'),
        ('S', 'Stopped'),
        ('F', 'Finished'),
        ('E', 'Error'),
]
SCENARIO_INSTANCE_STATUSES = [
        ('P', 'Scheduling'),
        ('R', 'Running'),
        ('AU', 'Agents Unreachable'),
        ('KO', 'Finished Ko'),
        ('OK', 'Finished Ok'),
        ('S', 'Stopped'),
]


MODELS_AND_STATUSES = [
        ('Agent', AGENT_STATUSES),
        ('JobInstance', JOB_INSTANCE_STATUSES),
        ('OpenbachFunctionInstance', OPENBACH_FUNCTION_INSTANCE_STATUSES),
        ('ScenarioInstance', SCENARIO_INSTANCE_STATUSES),
]


def convert_status_to_enum(apps, schema_editor):
    for model_name, statuses in MODELS_AND_STATUSES:
        Model = apps.get_model('openbach_django', model_name)
        for new, old in statuses:
            Model.objects.filter(status__istartswith=old).update(status=new)


def convert_enum_to_status(apps, schema_editor):
    for model_name, statuses in MODELS_AND_STATUSES:
        Model = apps.get_model('openbach_django', model_name)
        for new, old in statuses:
            Model.objects.filter(status=new).update(status=old)


class Migration(migrations.Migration):

    dependencies = [
        ('openbach_django', '0016_more_waiting_conditions'),
    ]

    operations = [
        migrations.RunPython(
            convert_status_to_enum,
            reverse_code=convert_enum_to_status,
        ),

        migrations.AlterField(
            model_name='agent',
            name='status',
            field=models.CharField(choices=AGENT_STATUSES, default='I', max_length=1),
        ),
        migrations.AlterField(
            model_name='jobinstance',
            name='status',
            field=models.CharField(choices=JOB_INSTANCE_STATUSES, default='?', max_length=2),
        ),
        migrations.AlterField(
            model_name='openbachfunctioninstance',
            name='status',
            field=models.CharField(choices=OPENBACH_FUNCTION_INSTANCE_STATUSES, default='P', max_length=1),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='scenarioinstance',
            name='status',
            field=models.CharField(choices=SCENARIO_INSTANCE_STATUSES, default='P', max_length=2),
            preserve_default=False,
        ),
    ]
