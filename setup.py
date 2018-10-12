"""
BAlto is a Language independent Test Orchestrator
"""
import sys
from setuptools import find_packages, setup

dependencies = [
    "prompt_toolkit",
    "docker",
    "urwid",
    "aiodocker",
    "aiohttp_json_rpc",
    "aiohttp",
    "yarl",
    "npyscreen",
]

if sys.version_info < (3, 7):
    dependencies.append('dataclasses')

setup(
    name="balto",
    version="0.1.2",
    url="https://github.com/lothiraldan/balto",
    license="BSD",
    author="Boris Feld",
    author_email="lothiraldan@gmail.com",
    description="BAlto is a Language independent Test Orchestrator",
    long_description=__doc__,
    packages=find_packages(exclude=["tests"]),
    include_package_data=True,
    zip_safe=False,
    platforms="any",
    install_requires=dependencies,
    python_requires=">=3.6",
    entry_points={
        "console_scripts": [
            "balto = balto.cli:main",
            "balto-server = balto.server:main",
            "balto-curses = balto.interfaces.curses:main",
        ]
    },
    classifiers=[
        # As from http://pypi.python.org/pypi?%3Aaction=list_classifiers
        # 'Development Status :: 1 - Planning',
        # 'Development Status :: 2 - Pre-Alpha',
        # 'Development Status :: 3 - Alpha',
        "Development Status :: 4 - Beta",
        # 'Development Status :: 5 - Production/Stable',
        # 'Development Status :: 6 - Mature',
        # 'Development Status :: 7 - Inactive',
        "Environment :: Console",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: BSD License",
        "Operating System :: POSIX",
        "Operating System :: MacOS",
        "Operating System :: Unix",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
)
