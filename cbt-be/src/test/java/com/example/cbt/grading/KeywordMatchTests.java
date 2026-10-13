package com.example.cbt.grading;

import static com.example.cbt.grading.GradingService.matchesKeyword;
import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class KeywordMatchTests {
  @Test
  void commaSeparatesAlternatives() {
    assertTrue(matchesKeyword("OSPF, ospf2", " ospf "));
    assertTrue(matchesKeyword("OSPF, ospf2", "ospf2"));
    assertFalse(matchesKeyword("OSPF, ospf2", "RIP"));
  }

  @Test
  void escapedCommaIsPartOfAnswer() {
    assertTrue(matchesKeyword("ㄱ\\,ㄴ\\,ㄹ", "ㄱ,ㄴ,ㄹ"));
    assertTrue(matchesKeyword("ㄱ\\,ㄴ\\,ㄹ", "ㄱ, ㄴ, ㄹ"));
    assertFalse(matchesKeyword("ㄱ\\,ㄴ\\,ㄹ", "ㄱ"));
    assertTrue(matchesKeyword("ㄱ\\,ㄴ, ㄴ\\,ㄱ", "ㄴ,ㄱ"));
  }

  @Test
  void blankKeywordsNeverMatch() {
    assertFalse(matchesKeyword(null, "a"));
    assertFalse(matchesKeyword("a", null));
    assertFalse(matchesKeyword(" , ", ""));
  }
}
