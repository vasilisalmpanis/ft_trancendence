#!/bin/bash

if command -v poetry &> /dev/null; then
    poetry install
    poetry build
    python3 -m pip install .
    /bin/bash -c "poetry shell; exec python3 -m transcendence_cli"
else
    echo "Poetry is not installed."
fi
