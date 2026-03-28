import json

# Test JSON string that has an unescaped newline
try:
    s = '{\n  "score": 90,\n  "suggestions": [\n    "This is a string\n With a newline"\n  ]\n}'
    json.loads(s)
except Exception as e:
    print("NEWLINE ERROR:", repr(e))
