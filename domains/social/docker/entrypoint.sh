#!/bin/sh
RESULTS_FILE=results/${RESULT_NAME}.message
EXPORT_SCRIPT="${EXPORT_SCRIPT_PAT:-docker/export_to_mongo.sh}"
API_HEALTHCHECK_RETRIES=60
API_HEALTHCHECK_INTERVAL=2

show_help() {
  echo """
  Commands
  ---------------------------------------------------------------

  run_tests                : run cucumber test harness
  export_results           : Run test harness and export results to external storage 
  """
}

healthcheckApiCall() {
    echo "Sending test request, result:"
    echo "-----"
    curl ${API_URL}
    RETURN=$?
    if [ $RETURN -eq 7 ]; then
      echo "Api healthcheck call failed, curl returned status code 7"
      return 1
    fi
    echo "-----"
    echo "Success in calling healthcheck API endpoint"
    return 0
}

waitForAPI() {
    echo "Testing API availability..."
    retries=$API_HEALTHCHECK_RETRIES
    interval=$API_HEALTHCHECK_INTERVAL
    notAvailable=1
    while [ $retries -ge 0 ] && [ $notAvailable -ne 0 ]; do
      healthcheckApiCall
      notAvailable=$?
      retries=$(( $retries - 1 ))
      if [ $retries -ne 5 ]; then 
         sleep 1
      fi
    done

    if [ $notAvailable -eq 1 ]; then
      echo "Gherkin tests will not be executed as API is not available."
      exit 1
    fi
    echo "API Available."
    return 0
}

# Corrected case statement with proper syntax
case "$1" in
  "run_tests" )
    waitForAPI
    # Tag selection:
    # - If CUCUMBER_TAGS is set, use it verbatim.
    # - Else build: optional PROFILE + optional TIER (default core), then exclude
    #   callback workflow scenarios unless enabled, and exclude signature scenarios unless enabled.
    TAGS="${CUCUMBER_TAGS:-}"
    if [ -z "$TAGS" ]; then
      PARTS=""

      if [ -n "${PROFILE:-}" ]; then
        PARTS="@profile=${PROFILE}"
      fi

      TIER_VALUE="${TIER:-core}"
      if [ -n "$TIER_VALUE" ] && [ "$TIER_VALUE" != "all" ]; then
        if [ -n "$PARTS" ]; then
          PARTS="$PARTS and @tier=$TIER_VALUE"
        else
          PARTS="@tier=$TIER_VALUE"
        fi
      fi

      if [ "${CALLBACK_SERVER_ENABLED:-false}" != "true" ]; then
        if [ -n "$PARTS" ]; then
          PARTS="$PARTS and not @needs-callback"
        else
          PARTS="not @needs-callback"
        fi
      fi

      if [ "${SIGNATURE_TESTS_ENABLED:-false}" != "true" ]; then
        if [ -n "$PARTS" ]; then
          PARTS="$PARTS and not @signature"
        else
          PARTS="not @signature"
        fi
      fi

      TAGS="$PARTS"
    fi

    EXIT_CODE=0
    if [ -n "$TAGS" ]; then
      npx cucumber-js --tags "$TAGS" \
        --format message:results/${RESULT_NAME}.message \
        --format junit:results/${RESULT_NAME}.xml \
        --format html:results/${RESULT_NAME}.html
      EXIT_CODE=$?
    else
      npx cucumber-js \
        --format message:results/${RESULT_NAME}.message \
        --format junit:results/${RESULT_NAME}.xml \
        --format html:results/${RESULT_NAME}.html
      EXIT_CODE=$?
    fi

    # Always attempt to generate a machine-readable summary, even on failures.
    node scripts/generate-summary.mjs "results/${RESULT_NAME}.message" "requirements.json" "results/${RESULT_NAME}.summary.json" || true
    exit $EXIT_CODE
    ;;
  * )
    show_help
    ;;
esac
