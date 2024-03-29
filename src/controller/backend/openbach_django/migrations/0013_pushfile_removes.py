# Generated by Django 3.2.10 on 2022-02-03 09:39

from django.db import migrations
import openbach_django.base_models


def populate_default_users_to_empty_list(apps, schema_editor):
    PushFile = apps.get_model('openbach_django', 'PushFile')
    for push in PushFile.objects.all():
        push.removes = [False] * len(push.users)
        push.save()


class Migration(migrations.Migration):

    dependencies = [
        ('openbach_django', '0012_pullfile'),
    ]

    operations = [
        migrations.AddField(
            model_name='pushfile',
            name='removes',
            field=openbach_django.base_models.OpenbachFunctionParameter(blank=True, null=True, type=list),
        ),

        migrations.RunPython(
            populate_default_users_to_empty_list,
            reverse_code=migrations.RunPython.noop,
        ),

        migrations.AlterField(
            model_name='pushfile',
            name='removes',
            field=openbach_django.base_models.OpenbachFunctionParameter(type=list),
        ),
    ]
