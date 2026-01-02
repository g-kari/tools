import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  generatePassword,
  calculateStrength,
  type PasswordOptions,
} from "../utils/password";
import { useToast } from "../components/Toast";
import { Slider } from "../components/Slider";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LinearProgress from "@mui/material/LinearProgress";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import ClearIcon from "@mui/icons-material/Clear";

export const Route = createFileRoute("/password-generator")({
  head: () => ({
    meta: [{ title: "パスワード生成ツール" }],
  }),
  component: PasswordGenerator,
});

function PasswordGenerator() {
  const [password, setPassword] = useState("");
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: false,
  });
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const announceStatus = useCallback((message: string) => {
    if (statusRef.current) {
      statusRef.current.textContent = message;
      setTimeout(() => {
        if (statusRef.current) {
          statusRef.current.textContent = "";
        }
      }, 3000);
    }
  }, []);

  const handleGenerate = useCallback(() => {
    if (!options.uppercase && !options.lowercase && !options.numbers && !options.symbols) {
      announceStatus("エラー: 少なくとも1つの文字種を選択してください");
      showToast("少なくとも1つの文字種を選択してください", "error");
      return;
    }
    const newPassword = generatePassword(options);
    setPassword(newPassword);
    setCopied(false);
    announceStatus("パスワードを生成しました");
    showToast("パスワードを生成しました", "success");
  }, [options, announceStatus, showToast]);

  const handleCopy = useCallback(async () => {
    if (!password) {
      announceStatus("エラー: コピーするパスワードがありません");
      showToast("コピーするパスワードがありません", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      announceStatus("パスワードをクリップボードにコピーしました");
      showToast("クリップボードにコピーしました", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      announceStatus("コピーに失敗しました");
      showToast("コピーに失敗しました", "error");
    }
  }, [password, announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setPassword("");
    setCopied(false);
    announceStatus("パスワードをクリアしました");
  }, [announceStatus]);

  const handleOptionChange = useCallback((key: keyof PasswordOptions, value: boolean | number) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleGenerate]);

  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const strength = calculateStrength(password, options);

  const getStrengthColor = (score: number) => {
    switch (score) {
      case 1: return "error";
      case 2: return "warning";
      case 3: return "info";
      case 4: return "success";
      case 5: return "success";
      default: return "inherit";
    }
  };

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="パスワード生成フォーム">
          <div className="converter-section">
            <Slider
              label="パスワードの長さ"
              value={options.length}
              onChange={(value) => handleOptionChange("length", value)}
              min={4}
              max={128}
              unit="文字"
              helpText="4文字から128文字までの長さを選択できます"
            />
          </div>

          <Accordion
            expanded={showAdvanced}
            onChange={() => setShowAdvanced(!showAdvanced)}
            sx={{ mb: 3, bgcolor: "background.paper" }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>詳細設定（文字種）</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={options.uppercase}
                      onChange={(e) => handleOptionChange("uppercase", e.target.checked)}
                    />
                  }
                  label="大文字 (A-Z)"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={options.lowercase}
                      onChange={(e) => handleOptionChange("lowercase", e.target.checked)}
                    />
                  }
                  label="小文字 (a-z)"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={options.numbers}
                      onChange={(e) => handleOptionChange("numbers", e.target.checked)}
                    />
                  }
                  label="数字 (0-9)"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={options.symbols}
                      onChange={(e) => handleOptionChange("symbols", e.target.checked)}
                    />
                  }
                  label="記号 (!@#$%...)"
                />
              </FormGroup>
            </AccordionDetails>
          </Accordion>

          <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
            <Button
              variant="contained"
              onClick={handleGenerate}
              startIcon={<RefreshIcon />}
            >
              生成
            </Button>
            <Button
              variant="outlined"
              onClick={handleCopy}
              disabled={!password}
              startIcon={<ContentCopyIcon />}
              color={copied ? "success" : "primary"}
            >
              {copied ? "コピーしました" : "コピー"}
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleClear}
              startIcon={<ClearIcon />}
            >
              クリア
            </Button>
          </Stack>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              生成されたパスワード
            </Typography>
            <TextField
              fullWidth
              id="passwordOutput"
              inputRef={passwordRef}
              value={password}
              slotProps={{
                input: { readOnly: true },
                htmlInput: {
                  "aria-live": "polite",
                  style: { fontFamily: "'Roboto Mono', monospace", fontSize: "1.1rem", letterSpacing: "0.05em" },
                },
              }}
              placeholder="パスワードを生成してください..."
            />
          </Box>

          {password && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                パスワード強度: {strength.label}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(strength.score / 5) * 100}
                color={getStrengthColor(strength.score) as "error" | "warning" | "info" | "success" | "inherit"}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
          )}
        </form>

        <aside
          className="info-box"
          role="complementary"
          aria-labelledby="usage-title"
        >
          <h3 id="usage-title">使い方</h3>
          <ul>
            <li>スライダーでパスワードの長さを調整（4〜128文字）</li>
            <li>使用する文字種をチェックボックスで選択</li>
            <li>「生成」ボタンで新しいパスワードを作成</li>
            <li>「コピー」ボタンでクリップボードにコピー</li>
            <li>キーボードショートカット: Ctrl+Enter で生成</li>
          </ul>
          <h4>セキュリティのヒント</h4>
          <ul>
            <li>パスワードは12文字以上を推奨</li>
            <li>複数の文字種を組み合わせると強度が上がります</li>
            <li>各サービスで異なるパスワードを使用してください</li>
            <li>パスワードマネージャーの利用をお勧めします</li>
          </ul>
        </aside>
      </div>

      <div
        ref={statusRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}
