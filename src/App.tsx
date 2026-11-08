import { catalog, type CatalogGame } from "./catalog";
import { notify, operationError } from "./services/feedback";
import { FeedbackHost } from "./components/ui/Feedback";

import { dismissFlyouts } from "./services/overlay";
import { Keyboard, PanelLeft } from "./components/icons";
import { Button } from "./components/ui/Button";
import { useState, useEffect, lazy } from "react";
import { DeferredPage, DeferredDialog } from "./components/ui/DeferredContent";
import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Sidebar, workspaceTitle } from "./shell/Sidebar";
import { LibraryScreen } from "./screens/Library/LibraryScreen";
import { GlobalSearch } from "./shell/GlobalSearch";
import { CommandPalette } from "./components/layout";
import { applyTheme } from "./services/theme";
import { startDesktopMaintenance } from "./services/desktopMaintenance";
import { currentPlayingGame, startPlayTimer, stopPlayTimer } from "./services/playTimer";
import { db } from "./db/schema";
import { GamesRepo } from "./db/repositories/GamesRepo";
import type { Game, Log } from "./types";
import "./styles/index.css";

const AddGameModal = lazy(() =>
  import("./screens/Library/AddGameModal").then((module) => ({ default: module.AddGameModal }))
);
const LogEditor = lazy(() =>
  import("./screens/LogEditor").then((module) => ({ default: module.LogEditor }))
);
const GameDetailScreen = lazy(() =>
  import("./screens/GameDetail/GameDetailScreen").then((module) => ({
    default: module.GameDetailScreen,
  }))
);
const RelatedGamesPage = lazy(() =>
  import("./screens/GameDetail/RelatedGamesPage").then((module) => ({
    default: module.RelatedGamesPage,
  }))
);
const ListsScreen = lazy(() =>
  import("./screens/Lists/ListsScreen").then((module) => ({ default: module.ListsScreen }))
);
const SingleListScreen = lazy(() =>
  import("./screens/Lists/SingleListScreen").then((module) => ({
    default: module.SingleListScreen,
  }))
);
const AddToListSheet = lazy(() =>
  import("./screens/Lists/AddToListSheet").then((module) => ({ default: module.AddToListSheet }))
);
const StatsScreen = lazy(() =>
  import("./screens/Stats/StatsScreen").then((module) => ({ default: module.StatsScreen }))
);
const RecommendScreen = lazy(() =>
  import("./screens/Recommend/RecommendScreen").then((module) => ({
    default: module.RecommendScreen,
  }))
);
const SettingsScreen = lazy(() =>
  import("./screens/Settings").then((module) => ({ default: module.SettingsScreen }))
);
const ImportReviewScreen = lazy(() =>
  import("./screens/ImportReview/ImportReviewScreen").then((module) => ({
    default: module.ImportReviewScreen,
  }))
);
const SearchScreen = lazy(() =>
  import("./screens/Search").then((module) => ({ default: module.SearchScreen }))
);
const SystemsScreen = lazy(() =>
  import("./screens/Systems/SystemsScreen").then((module) => ({ default: module.SystemsScreen }))
);
const FriendsScreen = lazy(() =>
  import("./screens/Friends/FriendsScreen").then((module) => ({ default: module.FriendsScreen }))
);
const ActivityScreen = lazy(() =>
  import("./screens/Activity/ActivityScreen").then((module) => ({ default: module.ActivityScreen }))
);

interface LogEditorTarget {
  game: Game;
  log: Log;
  prefill?: Partial<Log>;
  isNew?: boolean;
}

function SingleListRoute({ onOpenGame }: { onOpenGame: (igdbId: number) => void }) {
  const { listId } = useParams();
  const navigate = useNavigate();
  if (!listId) return null;
  return (
    <SingleListScreen listId={listId} onBack={() => navigate("/lists")} onOpenGame={onOpenGame} />
  );
}

function AppInner() {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    dismissFlyouts();
  }, [location.pathname]);

  useEffect(() => {
    applyTheme();
  }, []);

  // Dynamic page title — WCAG 2.4.2
  useEffect(() => {
    const PATH_TITLES: Record<string, string> = {
      "/": "Library",
      "/lists": "Lists",
      "/systems": "Systems",
      "/recommend": "What to play",
      "/activity": "Activity",
      "/friends": "Friends",
      "/stats": "Statistics",
      "/settings": "Settings",
      "/search": "Search",
      "/import/steam": "Import from Steam",
    };
    const base = "gamelog";
    // Match dynamic routes first, fall back to static map
    if (location.pathname.startsWith("/game/")) {
      document.title = location.pathname.endsWith("/related")
        ? `Related games — ${base}`
        : `Game Detail — ${base}`;
    } else if (location.pathname.startsWith("/lists/")) {
      document.title = `List — ${base}`;
    } else if (location.pathname.startsWith("/systems/")) {
      document.title = `System — ${base}`;
    } else {
      const label = PATH_TITLES[location.pathname];
      document.title = label ? `${label} — ${base}` : base;
    }
  }, [location.pathname]);

  // Fill missing cached release dates without triggering optional AI requests.
  useEffect(() => {
    GamesRepo.backfillReleaseDates();
  }, []);

  // Mac trackpad swipe-to-navigate
  useEffect(() => {
    let lastTime = 0;
    const handleWheel = (e: WheelEvent) => {
      // Must be primarily horizontal and a significant swipe
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 40) {
        const now = Date.now();
        if (now - lastTime < 600) return; // Debounce

        // Ensure we are not scrolling a horizontal container (e.g. Related Games)
        let target = e.target as HTMLElement | null;
        let isScrollable = false;
        while (target && target !== document.body) {
          const style = window.getComputedStyle(target);
          if (style.overflowX === "auto" || style.overflowX === "scroll") {
            if (target.scrollWidth > target.clientWidth) {
              // Check if we are not at the extreme edge
              if (e.deltaX < 0 && target.scrollLeft > 0) isScrollable = true;
              if (e.deltaX > 0 && target.scrollLeft + target.clientWidth < target.scrollWidth - 1)
                isScrollable = true;
              if (isScrollable) break;
            }
          }
          target = target.parentElement;
        }

        if (isScrollable) return;

        if (e.deltaX < -40 && window.history.length > 1) {
          // Swipe left-to-right to go BACK
          navigate(-1);
          lastTime = now;
        } else if (e.deltaX > 40) {
          // Swipe right-to-left to go FORWARD
          navigate(1);
          lastTime = now;
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [navigate]);

  // Dialogs are transient state on the current page. Replacing their URL keeps
  // native Back/Forward from revisiting completed forms or duplicate pages.
  const [searchParams, setSearchParams] = useSearchParams();

  const addGameOpen = searchParams.get("add-game") === "true";
  const [logEditorTarget, setLogEditorTarget] = useState<LogEditorTarget | null>(null);
  const [draftGame, setDraftGame] = useState<CatalogGame | undefined>(undefined);
  const [prefillState, setPrefillState] = useState<Partial<Log> | undefined>(undefined);
  const addToListIgdbId = searchParams.get("add-to-list");
  const addToListTitle = searchParams.get("list-title") || "";

  useEffect(() => {
    const handleOpenAdd = () => {
      setSearchParams(
        (prev) => {
          prev.delete("log");
          prev.delete("add-to-list");
          prev.set("add-game", "true");
          return prev;
        },
        { replace: true }
      );
    };
    window.addEventListener("gamelog:open-add-game", handleOpenAdd);
    return () => window.removeEventListener("gamelog:open-add-game", handleOpenAdd);
  }, [setSearchParams]);

  const openAddGame = () => {
    setSearchParams(
      (prev) => {
        prev.delete("log");
        prev.delete("add-to-list");
        prev.set("add-game", "true");
        return prev;
      },
      { replace: true }
    );
  };

  const closeAddGame = () => {
    setSearchParams(
      (prev) => {
        prev.delete("add-game");
        return prev;
      },
      { replace: true }
    );
  };

  const logIdParam = searchParams.get("log");
  useEffect(() => {
    let mounted = true;
    setLogEditorTarget(null);
    const id = Number(logIdParam);
    if (logIdParam && Number.isSafeInteger(id) && id > 0) {
      void (async () => {
        try {
          const [storedGame, storedLog] = await Promise.all([db.games.get(id), db.logs.get(id)]);
          const metadata =
            storedGame ?? (draftGame?.igdbId === id ? draftGame : await catalog.fetch(id));
          if (!mounted) return;
          if (!metadata) throw new Error("This game is unavailable. Please try again.");
          const now = Date.now();
          setLogEditorTarget({
            game: storedGame ?? { ...metadata, addedAt: now, updatedAt: now },
            log: storedLog ?? { igdbId: id, status: "Backlog", createdAt: now, updatedAt: now },
            prefill: prefillState,
            isNew: !storedGame,
          });
        } catch (error) {
          if (!mounted) return;
          notify("Could not open game log", {
            intent: "error",
            message: operationError(error, "Please try again."),
          });
          setSearchParams(
            (previous) => {
              previous.delete("log");
              return previous;
            },
            { replace: true }
          );
        }
      })();
    }
    return () => {
      mounted = false;
    };
  }, [logIdParam, prefillState, draftGame, setSearchParams]);

  const openLogEditor = (igdbId: number, prefill?: Partial<Log>, draft?: CatalogGame) => {
    setDraftGame(draft);
    setPrefillState(prefill);
    setSearchParams(
      (prev) => {
        prev.delete("add-game");
        prev.delete("add-to-list");
        prev.set("log", igdbId.toString());
        return prev;
      },
      { replace: true }
    );
  };

  const closeLogEditor = () => {
    setSearchParams(
      (prev) => {
        prev.delete("log");
        return prev;
      },
      { replace: true }
    );
    setPrefillState(undefined);
    setDraftGame(undefined);
  };

  const openAddToList = (igdbId: number, title: string) => {
    setSearchParams(
      (prev) => {
        prev.delete("add-game");
        prev.delete("log");
        prev.set("add-to-list", igdbId.toString());
        prev.set("list-title", title);
        return prev;
      },
      { replace: true }
    );
  };

  const closeAddToList = () => {
    setSearchParams(
      (prev) => {
        prev.delete("add-to-list");
        prev.delete("list-title");
        return prev;
      },
      { replace: true }
    );
  };

  const [macSidebarVisible, setMacSidebarVisible] = useState(true);
  const toggleMacSidebar = () => setMacSidebarVisible((visible) => !visible);

  useEffect(startDesktopMaintenance, []);
  const { pathname } = location;

  useEffect(
    () =>
      window.desktop?.onMenuCommand?.((action) => {
        const handleError = (error: unknown) =>
          notify(operationError(error, "Could not complete the play timer action."), {
            intent: "error",
          });
        if (/^game:\d+$/.test(action)) {
          navigate("/game/" + action.slice(5));
          return;
        }
        switch (action) {
          case "resume-playing":
            void currentPlayingGame()
              .then((game) => {
                if (game) navigate("/game/" + game.igdbId);
                else {
                  navigate("/");
                  notify("Mark a game as Playing to resume it from the Dock.");
                }
              })
              .catch(handleError);
            break;
          case "timer-start": {
            const match = /^\/game\/(\d+)(?:\/|$)/.exec(pathname);
            void startPlayTimer(match ? Number(match[1]) : undefined)
              .then((title) => notify("Play timer started for " + title, { intent: "success" }))
              .catch(handleError);
            break;
          }
          case "timer-stop":
            void stopPlayTimer()
              .then((session) => {
                if (!session)
                  notify("The original game log is gone. The timer was cleared.", {
                    intent: "error",
                  });
                else
                  notify(`Saved ${session.minutes} min to ${session.title}’s session history.`, {
                    intent: "success",
                  });
              })
              .catch(handleError);
            break;
          case "add":
            window.dispatchEvent(new Event("gamelog:open-add-game"));
            break;
          case "search":
            window.dispatchEvent(new Event("open-global-search"));
            break;
          case "commands":
            window.dispatchEvent(new Event("gamelog:open-command-palette"));
            break;
          case "sidebar":
            toggleMacSidebar();
            break;
          case "back":
            navigate(-1);
            break;
          case "forward":
            navigate(1);
            break;
          case "library":
            navigate("/");
            break;
          case "settings":
          case "lists":
          case "systems":
          case "recommend":
          case "activity":
          case "friends":
          case "stats":
            navigate("/" + action);
            break;
        }
      }),
    [navigate, pathname]
  );

  const openGame = (igdbId: number) => navigate(`/game/${igdbId}`);

  return (
    <div className="app-shell">
      {/* Skip to main content — WCAG 2.4.1 */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="app-titlebar">
        <div className="app-titlebar-brand">
          <Button
            variant="ghost"
            aria-label={macSidebarVisible ? "Hide sidebar" : "Show sidebar"}
            aria-expanded={macSidebarVisible}
            onClick={toggleMacSidebar}
          >
            <PanelLeft />
          </Button>
          <span className="app-workspace-title" title={workspaceTitle(location.pathname)}>
            {workspaceTitle(location.pathname)}
          </span>
        </div>
        <div className="app-titlebar-search">
          <GlobalSearch />
        </div>
        <div className="app-titlebar-trailing">
          <Button
            variant="ghost"
            aria-label="Open command palette"
            title="Commands (⌘K)"
            onClick={() => window.dispatchEvent(new Event("gamelog:open-command-palette"))}
          >
            <Keyboard />
          </Button>
        </div>
      </header>
      <div className="app-workspace">
        {macSidebarVisible && <Sidebar onAddGame={openAddGame} />}
        <div className="app-content">
          <DeferredPage resetKey={location.pathname}>
            <Routes>
              <Route
                path="/"
                element={
                  <LibraryScreen
                    onAddGame={openAddGame}
                    onOpenLog={openLogEditor}
                    onOpenGame={openGame}
                  />
                }
              />
              <Route
                path="/search"
                element={<SearchScreen onOpenGame={openGame} onOpenLog={openLogEditor} />}
              />
              <Route
                path="/lists"
                element={<ListsScreen onOpenList={(id) => navigate(`/lists/${id}`)} />}
              />
              <Route path="/lists/:listId" element={<SingleListRoute onOpenGame={openGame} />} />
              <Route path="/stats" element={<StatsScreen />} />
              <Route path="/recommend" element={<RecommendScreen />} />
              <Route path="/activity" element={<ActivityScreen />} />
              <Route path="/friends" element={<FriendsScreen onOpenGame={openGame} />} />
              <Route
                path="/systems"
                element={<SystemsScreen onOpenGame={openGame} onOpenLog={openLogEditor} />}
              />
              <Route
                path="/systems/:platformId"
                element={<SystemsScreen onOpenGame={openGame} onOpenLog={openLogEditor} />}
              />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="/import/steam" element={<ImportReviewScreen />} />
              <Route
                path="/game/:igdbId"
                element={
                  <GameDetailScreen
                    onOpenLog={openLogEditor}
                    onOpenGame={openGame}
                    onOpenAddToList={openAddToList}
                  />
                }
              />
              <Route
                path="/game/:igdbId/related"
                element={<RelatedGamesPage onOpenGame={openGame} />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </DeferredPage>
        </div>
      </div>

      {/* Add game modal */}
      {addGameOpen && (
        <DeferredDialog onClose={closeAddGame} title="Add game">
          <AddGameModal
            onClose={closeAddGame}
            onOpenGame={(id) => {
              closeAddGame();
              openGame(id);
            }}
            onStartLog={(game, prefill) => openLogEditor(game.igdbId, prefill, game)}
          />
        </DeferredDialog>
      )}

      {/* Log Editor modal */}
      {logEditorTarget && (
        <DeferredDialog onClose={closeLogEditor} title="Game log">
          <LogEditor
            key={logEditorTarget.game.igdbId}
            game={logEditorTarget.game}
            log={logEditorTarget.log}
            prefill={logEditorTarget.prefill}
            isNew={logEditorTarget.isNew}
            onClose={closeLogEditor}
            onDelete={closeLogEditor}
          />
        </DeferredDialog>
      )}

      {/* Add to list sheet */}
      {addToListIgdbId && (
        <DeferredDialog onClose={closeAddToList} title="Add to list">
          <AddToListSheet
            igdbId={parseInt(addToListIgdbId, 10)}
            title={addToListTitle}
            onClose={closeAddToList}
          />
        </DeferredDialog>
      )}

      {/* ⌘K Command Palette */}
      <CommandPalette />
      <FeedbackHost />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
