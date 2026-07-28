import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/api";
import type { Poll } from "@/features/polls/poll-api";
import type { PollResults } from "@/features/polls/public-poll-api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ?? API_URL.replace(/\/api\/v1\/?$/, "");

type ResponseSubmittedPayload = {
  pollId: string;
  totalResponses: number;
};

type PollDeletedPayload = {
  pollId: string;
};

type ClientToServerEvents = {
  joinPoll: (payload: { pollId: string }) => void;
  leavePoll: (payload: { pollId: string }) => void;
};

type ServerToClientEvents = {
  joinedPoll: (payload: { pollId: string }) => void;
  leftPoll: (payload: { pollId: string }) => void;
  error: (payload: { message: string }) => void;
  responseSubmitted: (payload: ResponseSubmittedPayload) => void;
  resultsUpdated: (payload: PollResults) => void;
  pollUpdated: (payload: Poll) => void;
  pollDeleted: (payload: PollDeletedPayload) => void;
  quizQuestionOpened: (payload: Poll) => void;
  quizQuestionClosed: (payload: Poll) => void;
  quizFinished: (payload: Poll) => void;
  quizAnswerReceived: (payload: {
    pollId: string;
    questionId: string;
    totalAnswers: number;
  }) => void;
};

type PollSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type UsePollSocketOptions = {
  pollId: string | null;
  enabled?: boolean;
  onResultsUpdated?: (results: PollResults) => void;
  onResponseSubmitted?: (payload: ResponseSubmittedPayload) => void;
  onPollUpdated?: (poll: Poll) => void;
  onPollDeleted?: () => void;
  onQuizChanged?: (poll: Poll) => void;
};

export function usePollSocket({
  pollId,
  enabled = true,
  onResultsUpdated,
  onResponseSubmitted,
  onPollUpdated,
  onPollDeleted,
  onQuizChanged,
}: UsePollSocketOptions) {
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);

  const onResultsUpdatedRef = useRef(onResultsUpdated);
  const onResponseSubmittedRef = useRef(onResponseSubmitted);
  const onPollUpdatedRef = useRef(onPollUpdated);
  const onPollDeletedRef = useRef(onPollDeleted);
  const onQuizChangedRef = useRef(onQuizChanged);

  useEffect(() => {
    onResultsUpdatedRef.current = onResultsUpdated;
    onResponseSubmittedRef.current = onResponseSubmitted;
    onPollUpdatedRef.current = onPollUpdated;
    onPollDeletedRef.current = onPollDeleted;
    onQuizChangedRef.current = onQuizChanged;
  });

  useEffect(() => {
    if (!enabled || !pollId) {
      return;
    }

    const token = getAccessToken();
    const socket: PollSocket = io(SOCKET_URL, {
      withCredentials: true,
      auth: token ? { token } : {},
      transports: ["websocket", "polling"],
    });

    const handleConnect = () => {
      setConnected(true);
      setSocketError(null);
      socket.emit("joinPoll", { pollId });
    };

    const handleDisconnect = () => {
      setConnected(false);
      setJoined(false);
    };

    const handleJoined = (payload: { pollId: string }) => {
      if (payload.pollId === pollId) {
        setJoined(true);
      }
    };

    const handleError = (payload: { message: string }) => {
      setSocketError(payload.message);
    };

    const handleResults = (results: PollResults) => {
      if (results.pollId === pollId) {
        onResultsUpdatedRef.current?.(results);
      }
    };

    const handleSubmitted = (payload: ResponseSubmittedPayload) => {
      if (payload.pollId === pollId) {
        onResponseSubmittedRef.current?.(payload);
      }
    };

    const handlePollUpdated = (poll: Poll) => {
      if (poll.id === pollId) {
        onPollUpdatedRef.current?.(poll);
        onQuizChangedRef.current?.(poll);
      }
    };

    const handlePollDeleted = (payload: PollDeletedPayload) => {
      if (payload.pollId === pollId) {
        onPollDeletedRef.current?.();
      }
    };

    const handleQuizEvent = (poll: Poll) => {
      if (poll.id === pollId) {
        onPollUpdatedRef.current?.(poll);
        onQuizChangedRef.current?.(poll);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("joinedPoll", handleJoined);
    socket.on("error", handleError);
    socket.on("resultsUpdated", handleResults);
    socket.on("responseSubmitted", handleSubmitted);
    socket.on("pollUpdated", handlePollUpdated);
    socket.on("pollDeleted", handlePollDeleted);
    socket.on("quizQuestionOpened", handleQuizEvent);
    socket.on("quizQuestionClosed", handleQuizEvent);
    socket.on("quizFinished", handleQuizEvent);

    return () => {
      socket.emit("leavePoll", { pollId });
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("joinedPoll", handleJoined);
      socket.off("error", handleError);
      socket.off("resultsUpdated", handleResults);
      socket.off("responseSubmitted", handleSubmitted);
      socket.off("pollUpdated", handlePollUpdated);
      socket.off("pollDeleted", handlePollDeleted);
      socket.off("quizQuestionOpened", handleQuizEvent);
      socket.off("quizQuestionClosed", handleQuizEvent);
      socket.off("quizFinished", handleQuizEvent);
      socket.disconnect();
      setConnected(false);
      setJoined(false);
    };
  }, [enabled, pollId]);

  return { connected, joined, socketError };
}
