import json
import subprocess


class SubprocessRunnerSession(object):

    def __init__(self, base_cmd, working_directory, displayer, tests_to_run=[]):
        self.working_directory = working_directory
        self.base_cmd = base_cmd
        self.displayer = displayer
        self.tests_to_run = tests_to_run

    def run(self):
        if self.tests_to_run:
            tests = " ".join(["'%s'" % x for x in self.tests_to_run])
        else:
            tests = ''

        final_cmd = self.base_cmd % tests

        # Reinitialize variables
        self.test_number = None
        self.current_test_number = 0

        p = self.launch_cmd(final_cmd)

        for line in iter(p.stdout.readline, ''):
            try:
                data = json.loads(line)
                self.displayer.parse_message(data)
            except ValueError:
                pass

        print("Done")

    def launch_cmd(self, cmd):
        return subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=self.working_directory,
            shell=True)
