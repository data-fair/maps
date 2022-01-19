#!/bin/bash

handle_SIGTERM() {
  kill -s SIGTERM $(pidof node)
}

trap handle_SIGTERM SIGTERM

xvfb-run -a -- node server &
wait $! || RETVAL=$?
exit ${RETVAL}