from dataclasses import dataclass


@dataclass
class ProgramData:
    ws_counter: int = 0
    ws_name: str = " " * 20


program_data = ProgramData()


def main_para():
    global program_data
    program_data.ws_counter = 100
    program_data.ws_name = "HELLO WORLD"
    display_para()
    return


def display_para():
    global program_data
    print(f"Counter: {program_data.ws_counter}")
    print(f"Name: {program_data.ws_name}")
    return


if __name__ == "__main__":
    main_para()
