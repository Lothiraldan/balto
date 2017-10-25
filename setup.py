"""
Language-Independent Test Runner
"""
from setuptools import find_packages, setup

dependencies = ['prompt_toolkit', 'docker', 'urwid', 'aiodocker']

setup(
    name='litr',
    version='0.1.0',
    url='https://github.com/lothiraldan/litr',
    license='BSD',
    author='Boris Feld',
    author_email='lothiraldan@gmail.com',
    description='Language-Independent Test Runner',
    long_description=__doc__,
    packages=find_packages(exclude=['tests']),
    include_package_data=True,
    zip_safe=False,
    platforms='any',
    install_requires=dependencies,
    python_requires='>=3.5',
    entry_points={
        'console_scripts': [
            'litr = litr.cli:main',
        ],
    },
    classifiers=[
        # As from http://pypi.python.org/pypi?%3Aaction=list_classifiers
        # 'Development Status :: 1 - Planning',
        # 'Development Status :: 2 - Pre-Alpha',
        # 'Development Status :: 3 - Alpha',
        'Development Status :: 4 - Beta',
        # 'Development Status :: 5 - Production/Stable',
        # 'Development Status :: 6 - Mature',
        # 'Development Status :: 7 - Inactive',
        'Environment :: Console',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: BSD License',
        'Operating System :: POSIX',
        'Operating System :: MacOS',
        'Operating System :: Unix',
        'Programming Language :: Python',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.5',
        'Programming Language :: Python :: 3.6',
        'Topic :: Software Development :: Libraries :: Python Modules',
    ]
)
