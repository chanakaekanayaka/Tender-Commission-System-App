import { Schema, model, models, type Document } from "mongoose";

export interface CounterDocument extends Omit<Document, "_id"> {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<CounterDocument>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const CounterModel = models.Counter ?? model<CounterDocument>("Counter", counterSchema);

/** Atomically increments and returns a named sequence — $inc + upsert is a single atomic
 *  operation in MongoDB, so concurrent callers never get the same number twice. */
export async function getNextSequence(counterName: string): Promise<number> {
  const result = await CounterModel.findOneAndUpdate(
    { _id: counterName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return result!.seq;
}
