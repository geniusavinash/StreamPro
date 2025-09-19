#!/usr/bin/env python3

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="camera-streaming-sdk",
    version="1.0.0",
    author="Camera Streaming Platform",
    author_email="support@camera-streaming.example.com",
    description="Official Python SDK for the Camera Streaming Platform API",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/camera-streaming/python-sdk",
    project_urls={
        "Bug Tracker": "https://github.com/camera-streaming/python-sdk/issues",
        "Documentation": "https://docs.camera-streaming.example.com/python-sdk",
        "Source Code": "https://github.com/camera-streaming/python-sdk",
    },
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Multimedia :: Video",
        "Topic :: System :: Monitoring",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "pytest-cov>=4.0.0",
            "black>=23.0.0",
            "isort>=5.12.0",
            "flake8>=6.0.0",
            "mypy>=1.0.0",
            "pre-commit>=3.0.0",
        ],
        "websocket": [
            "websockets>=11.0.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "camera-streaming=camera_streaming.cli:main",
        ],
    },
    include_package_data=True,
    zip_safe=False,
)