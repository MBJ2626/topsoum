/** Erreur d'appel HTTP : le message reste celui montre a l'utilisateur, le statut sert a decider d'une relance. */
export class HttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}
