import pytest
from dataclasses import dataclass

@dataclass
class WsNum:
    ws_num: int = 100

def test_wsnum_default():
    ws = WsNum()
    assert ws.ws_num == 100

def test_wsnum_custom():
    ws = WsNum(ws_num=50)
    assert ws.ws_num == 50