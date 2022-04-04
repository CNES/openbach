from distutils.core import setup, Extension


MAJOR_VERSION = '2'
MINOR_VERSION = '1'
DEBUG_VERSION = '0'


collect_agent = Extension(
        'collect_agent',
        define_macros=[
            ('MAJOR_VERSION', MAJOR_VERSION),
            ('MINOR_VERSION', MINOR_VERSION),
            ('DEBUG_VERSION', DEBUG_VERSION)],
        include_dirs=['../src/'],
        library_dirs=['../build/'],
        libraries=['collectagent'],
        sources=['collectagentmodule.cpp'],
        extra_compile_args=['-std=c++11'])


setup(name='collect_agent',
      version='{}.{}.{}'.format(MAJOR_VERSION, MINOR_VERSION, DEBUG_VERSION),
      description='Collect-Agent API',
      author='Viveris Technologies',
      author_email='mettinger@toulouse.viveris.com',
      url='https://openbach.org',
      long_description='''Collect-Agent API
Collection of tools aimed at OpenBACH agents to
send informations such as logs, files or statistics
to their collector.
''',
      ext_modules=[collect_agent])
