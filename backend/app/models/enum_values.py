from __future__ import annotations

from enum import Enum
from typing import TypeVar

EnumType = TypeVar("EnumType", bound=Enum)


def enum_values(enum_cls: type[EnumType]) -> list[str]:
    return [str(member.value) for member in enum_cls]
