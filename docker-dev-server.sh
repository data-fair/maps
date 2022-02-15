#!/bin/bash

handle_SIGTERM() {
  kill -TERM $(pidof node)
}

trap handle_SIGTERM SIGTERM

xvfb-run -a -- ./node_modules/.bin/nodemon --signal SIGTERM server &
wait $! || RETVAL=$?
wait
exit ${RETVAL}