import sys

class TestDisplayer(object):
    def __init__(self, tests):
        self.tests = tests
        self.test_number = None
        self.current_test_number = 0

    async def parse_message(self, message):
        msg_type = message.get('_type')

        if msg_type == 'session_start':
            self.test_number = message['test_number']
            print(
                "Tests session started, %d tests detected:" % self.test_number)
            sys.stdout.flush()
            self.current_test_number = 0
        elif msg_type == 'test_result':
            # Ignore invalid json
            if 'id' not in message or 'outcome' not in message:
                return

            self.tests[message['id']] = message

            test_number = self.current_test_number + 1
            self.current_test_number = test_number

            if self.test_number is not None:
                ptn = "%d/%d" % (test_number, self.test_number)
            else:
                ptn = "%d" % test_number

            print("%s %s %s: %s" % (ptn, message['file'], message['test_name'],
                                    message['outcome']))
            sys.stdout.flush()
        elif msg_type == 'session_end':
            print("Tests session end, %d failed, %d passed in %.4f seconds" %
                  (message['failed'], message['passed'],
                   message['total_duration']))
            sys.stdout.flush()
        else:
            print(message)
            sys.stdout.flush()
