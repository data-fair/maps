#!/bin/bash

handle_SIGTERM() {
  kill -TERM $(pidof node)
}

trap handle_SIGTERM SIGTERM

xvfb-run -a -- node server &
wait $! || RETVAL=$?
exit ${RETVAL}