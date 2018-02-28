module Main exposing (..)

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import View exposing (..)
import Model exposing (..)
import WebSocket
import Treeview
import Json.Encode as E
import Json.Decode exposing (string, int, Decoder, list, nullable, at)
import Dict exposing (Dict)
import Dict.Extra exposing (groupBy)
import String.Extra exposing (replace)
import Json.Decode.Pipeline
    exposing
        ( decode
        , required
        , optional
        , hardcoded
        )


type alias Flags =
    { wsEndpoint : String }


main =
    programWithFlags
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }



-- MODEL


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( Model [] Dict.empty [] flags.wsEndpoint, Cmd.none )



-- ENCODE


encode : JSONRPCMSG -> E.Value
encode jsonrpcmsg =
    E.object
        [ ( "jsonrpc", E.string jsonrpcmsg.jsonrpc )
        , ( "id", E.int jsonrpcmsg.id )
        , ( "method", E.string jsonrpcmsg.method )
        , ( "params", E.string jsonrpcmsg.params )
        ]



-- DECODE


jsonrpcanswerDecoder =
    decode JSONRPCAnswer
        |> Json.Decode.Pipeline.required "jsonrpc" string
        |> Json.Decode.Pipeline.optional "result" string ""
        |> Json.Decode.Pipeline.optional "method" string ""


baseLITFDecoder =
    decode LITFMSG
        |> Json.Decode.Pipeline.required "_type" string


testCollectionDecoder =
    decode TestResult
        |> Json.Decode.Pipeline.required "_type" string
        |> Json.Decode.Pipeline.required "test_name" string
        |> Json.Decode.Pipeline.required "file" string
        |> Json.Decode.Pipeline.required "line" int
        |> Json.Decode.Pipeline.required "suite_name" string
        |> Json.Decode.Pipeline.required "id" string
        |> hardcoded "collected"
        |> hardcoded 0.0
        |> hardcoded ""
        |> hardcoded ""


testResultDecoder =
    decode TestResult
        |> Json.Decode.Pipeline.required "_type" string
        |> Json.Decode.Pipeline.required "test_name" string
        |> Json.Decode.Pipeline.required "file" string
        |> Json.Decode.Pipeline.required "line" int
        |> Json.Decode.Pipeline.required "suite_name" string
        |> Json.Decode.Pipeline.required "id" string
        |> Json.Decode.Pipeline.required "outcome" string
        |> Json.Decode.Pipeline.required "duration" Json.Decode.float
        |> Json.Decode.Pipeline.required "stdout" string
        |> Json.Decode.Pipeline.required "stderr" string



-- UPDATE


collectAll messages tests tree wsUrl =
    let
        msg =
            E.object [ ( "jsonrpc", E.string "2.0" ), ( "id", E.int 0 ), ( "method", E.string "collect_all" ), ( "params", E.string "" ) ]
    in
        ( Model messages tests tree wsUrl, WebSocket.send wsUrl (E.encode 1 msg) )


subscribe messages tests tree wsUrl =
    let
        msg =
            E.object [ ( "jsonrpc", E.string "2.0" ), ( "id", E.int 0 ), ( "method", E.string "subscribe" ), ( "params", E.string "test" ) ]
    in
        ( Model messages tests tree wsUrl, WebSocket.send wsUrl (E.encode 1 msg) )


runAll messages tests tree wsUrl =
    let
        msg =
            E.object [ ( "jsonrpc", E.string "2.0" ), ( "id", E.int 0 ), ( "method", E.string "run_all" ), ( "params", E.string "" ) ]
    in
        ( Model messages tests tree wsUrl, WebSocket.send wsUrl (E.encode 1 msg) )


tryDecodeTestCollection str =
    let
        msg =
            Json.Decode.decodeString (at [ "params" ] testCollectionDecoder) str
    in
        case msg of
            Err err_msg ->
                Nothing

            Ok data ->
                Just data


tryDecodeTestResult str =
    let
        msg =
            Json.Decode.decodeString (at [ "params" ] testResultDecoder) str
    in
        case msg of
            Err err_msg ->
                Nothing

            Ok data ->
                Just data


tryDecodeJSONRPCLITF str =
    let
        msg =
            Json.Decode.decodeString (at [ "params" ] baseLITFDecoder) str
    in
        case msg of
            Err err_msg ->
                Nothing

            Ok data ->
                case data.msg_type of
                    "test_collection" ->
                        tryDecodeTestCollection str

                    "test_result" ->
                        tryDecodeTestResult str

                    _ ->
                        Nothing


tryDecodeJsonRPC str =
    let
        result =
            ""

        jsonMsg =
            Json.Decode.decodeString jsonrpcanswerDecoder str
    in
        case jsonMsg of
            Err err_msg ->
                Nothing

            Ok status ->
                if status.method == "test" then
                    tryDecodeJSONRPCLITF str
                else
                    Nothing


testResultNode test =
    let
        node =
            Treeview.Node test.id test.test_name (Treeview.Options test.outcome True True False True False) Nothing

        log =
            Debug.log "testresult" (node)
    in
        node


fileNode ( file_name, tests ) =
    let
        testsChildren =
            List.map testResultNode tests
    in
        Treeview.node file_name file_name "" False (Just testsChildren)


testsGroupedByFile tests =
    groupBy (\test -> test.file) tests


suiteNode ( suite_name, tests ) =
    let
        testsByFile =
            List.map fileNode (Dict.toList (testsGroupedByFile tests))

        log =
            Debug.log "testsByFile" testsByFile
    in
        Treeview.node suite_name suite_name "" True (Just testsByFile)


testsGroupedBySuite tests =
    let
        testsList =
            Dict.values tests
    in
        groupBy (\test -> test.suite_name) testsList


treeFromTests tests =
    let
        testsList =
            Dict.values tests

        testsBySuite =
            testsGroupedBySuite tests
    in
        List.map suiteNode (Dict.toList testsBySuite)



{- List.map (\test -> Treeview.node test.id test.test_name test.outcome True Nothing) testsList -}


parseMsg messages tests tree str =
    let
        decoded =
            tryDecodeJsonRPC str

        log =
            Debug.log "incoming_msg" decoded
    in
        case decoded of
            Nothing ->
                ( (str :: messages), tests, tree )

            Just val ->
                let
                    newMessages =
                        (str :: messages)
                in
                    ( newMessages, (Dict.update val.id (\_ -> Just val) tests), (treeFromTests (Dict.update val.id (\_ -> Just val) tests)) )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg { messages, tests, tree, wsUrl } =
    case msg of
        Subscribe ->
            subscribe messages tests tree wsUrl

        CollectAll ->
            collectAll messages tests tree wsUrl

        RunAll ->
            runAll messages tests tree wsUrl

        NewMessage str ->
            let
                ( newMessages, newTests, newTree ) =
                    parseMsg messages tests tree str
            in
                ( Model newMessages newTests newTree wsUrl, Cmd.none )

        TVMSG subMsg ->
            let
                updateTree =
                    Treeview.update subMsg tree

                llog =
                    Debug.log "UpdatedTree" updateTree

                llog2 =
                    Debug.log "Tree" tree
            in
                ( Model messages tests updateTree wsUrl, Cmd.none )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions model =
    WebSocket.listen model.wsUrl NewMessage



-- VIEW
