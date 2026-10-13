package com.example.cbt;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class QuestionImageTests {
  static Path dir;

  @Autowired MockMvc mvc;

  @DynamicPropertySource
  static void imagesDir(DynamicPropertyRegistry r) throws Exception {
    dir = Files.createTempDirectory("question-images");
    Files.write(dir.resolve("2024-1_q05_1.png"), new byte[] {(byte) 0x89, 'P', 'N', 'G'});
    Files.writeString(dir.getParent().resolve("secret.txt"), "x");
    r.add("app.question-images-dir", dir::toString);
  }

  @Test
  void servesImageWithoutLogin() throws Exception {
    mvc.perform(get("/api/question-images/2024-1_q05_1.png"))
        .andExpect(status().isOk())
        .andExpect(content().contentType("image/png"));
  }

  @Test
  void missingOrOutsideFilesAreNotServed() throws Exception {
    mvc.perform(get("/api/question-images/none.png")).andExpect(status().isNotFound());
    mvc.perform(get("/api/question-images/..%2Fsecret.txt"))
        .andExpect(result -> {
          if (result.getResponse().getStatus() == 200)
            throw new AssertionError("path traversal served a file");
        });
  }
}
