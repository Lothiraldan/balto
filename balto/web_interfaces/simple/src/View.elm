module View exposing (..)

import Model exposing (..)
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Treeview
import Dict exposing (Dict)


testStyle color =
    case color of
        "collected" ->
            style [ ( "color", "gray" ) ]

        "failed" ->
            style [ ( "color", "red" ) ]

        "passed" ->
            style [ ( "color", "green" ) ]

        "skipped" ->
            style [ ( "color", "blue" ) ]

        _ ->
            style []


testView : TestResult -> Html msg
testView test =
    let
        teststr =
            test.test_name ++ ": " ++ (toString test)
    in
        li [ (testStyle test.outcome) ] [ text teststr ]


styles : Treeview.Styles
styles =
    [ Treeview.Style "passed" ( "check-circle", "check-circle" ) "green"
    , Treeview.Style "collected" ( "check-circle", "check-circle" ) ""
    , Treeview.Style "failed" ( "check-circle", "check-circle" ) "red"
    , Treeview.Style "skipped" ( "check-circle", "check-circle" ) "blue"
    ]


config : Treeview.Config
config =
    let
        d =
            Treeview.default styles
    in
        { d | checkbox = { enable = True, multiple = True, cascade = True } }


view : Model -> Html Msg
view model =
    let
        testsList =
            Dict.values model.tests

        testUL =
            List.map testView testsList
    in
        div []
            [ Html.map TVMSG (Treeview.view config model.tree)

            {- , ul [] testUL -}
            {- , input [onInput Input] []
               , button [onClick Send] [text "Send"]
            -}
            , button [ onClick Subscribe ] [ text "Subscribe" ]
            , button [ onClick CollectAll ] [ text "CollectAll" ]
            , button [ onClick RunAll ] [ text "RunAll" ]
            ]
