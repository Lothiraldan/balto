module Model exposing (..)

import Treeview
import Dict exposing (Dict)


type alias Model =
    { messages : List String
    , tests : Dict String TestResult
    , tree : Treeview.Model
    , wsUrl : String
    }


type alias JSONRPCMSG =
    { jsonrpc : String
    , id : Int
    , method : String
    , params : String
    }


type alias LITFMSG =
    { msg_type : String
    }


type alias LITFJSONRPCAnswer =
    { jsonrpc : String
    , result : String
    , method : String
    , params : LITFMSG
    }


type alias TestResult =
    { msg_type : String
    , test_name : String
    , file : String
    , line : Int
    , suite_name : String
    , id : String
    , outcome : String
    , duration : Float
    , stdout : String
    , stderr : String
    }


type alias JSONRPCAnswer =
    { jsonrpc : String
    , result : String
    , method : String
    }


type Msg
    = CollectAll
    | RunAll
    | Subscribe
    | NewMessage String
    | TVMSG Treeview.Msg
