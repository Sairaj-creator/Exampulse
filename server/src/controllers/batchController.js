import * as batchService from "../services/batchService.js";
import { sendSuccess } from "../utils/response.js";

export async function listBatches(req, res) {
  return sendSuccess(res, await batchService.listBatches());
}

export async function createBatch(req, res) {
  return sendSuccess(
    res,
    { batch: await batchService.createBatch(req.body) },
    201,
  );
}

export async function updateBatch(req, res) {
  return sendSuccess(res, {
    batch: await batchService.updateBatch(req.params.id, req.body),
  });
}

export async function deleteBatch(req, res) {
  return sendSuccess(res, await batchService.deleteBatch(req.params.id));
}
