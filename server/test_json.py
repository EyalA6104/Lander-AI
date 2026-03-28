import json

# Test JSON string that ends abruptly
try:
    s = '{\n  "score": 90,\n  "suggestions": [\n    "This is a string'
    json.loads(s)
except Exception as e:
    print(repr(e))
