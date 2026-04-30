from fastapi import Request
import asyncio
import sys
sys.path.append('ml-service')
import routers.admin
from core.model_engine import ModelEngine
class MockApp:
    class state:
        engine = ModelEngine()
        engine.train()
class MockReq:
    app = MockApp()

try:
    print(asyncio.run(routers.admin.get_live_alerts(MockReq())))
except Exception as e:
    import traceback
    traceback.print_exc()
