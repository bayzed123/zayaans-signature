/**
 * Virtual try-on modal.
 *
 * Privacy contract: the customer's photo is read with `URL.createObjectURL`
 * and drawn straight to a `<canvas>` -- it is never passed to `fetch`,
 * `XMLHttpRequest`, or any network call, and nothing about it is written to
 * localStorage/IndexedDB. Closing the modal discards it completely. The pose
 * model itself is a small file downloaded once from TensorFlow's public model
 * CDN (the same way any web font or icon set is fetched); that download
 * carries no photo data, only the reusable model weights.
 *
 * Fit is computed automatically from on-device pose detection (shoulder span
 * and tilt), then the shopper can nudge position, size and rotation by hand.
 * This is an aligned overlay, not an AI-generated photorealistic render --
 * fabric drape, folds and lighting are not simulated.
 */
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Camera,
  Download,
  Loader2,
  RotateCw,
  ShieldCheck,
  Upload,
  X,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";
import { commerceRequest, productImage, type Product } from "@/lib/commerce";
import {
  applyAdjustment,
  computeGarmentPlacement,
  extractBodyKeypoints,
  fallbackPlacement,
  NEUTRAL_ADJUSTMENT,
  type TryOnAdjustment,
} from "@/lib/tryOn";

type Stage = "upload" | "detecting" | "ready" | "unsupported";

// Loaded once per browser tab and reused across every time the shopper opens the tool.
let detectorPromise: Promise<
  import("@tensorflow-models/pose-detection").PoseDetector
> | null = null;

async function loadDetector() {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const tf = await import("@tensorflow/tfjs");
      try {
        await tf.setBackend("webgl");
      } catch {
        await tf.setBackend("cpu");
      }
      await tf.ready();
      const poseDetection = await import("@tensorflow-models/pose-detection");
      return poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        }
      );
    })().catch(error => {
      detectorPromise = null;
      throw error;
    });
  }
  return detectorPromise;
}

export default function TryOnModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<Stage>("upload");
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [placement, setPlacement] = useState<ReturnType<
    typeof fallbackPlacement
  > | null>(null);
  const [adjustment, setAdjustment] =
    useState<TryOnAdjustment>(NEUTRAL_ADJUSTMENT);
  const [garmentImage, setGarmentImage] = useState<HTMLImageElement | null>(
    null
  );
  const [showContactForm, setShowContactForm] = useState(false);
  const [submittingContact, setSubmittingContact] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // The garment cutout loads once, independent of the customer's photo.
  useEffect(() => {
    let alive = true;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (alive) setGarmentImage(image);
    };
    image.src = productImage(product);
    return () => {
      alive = false;
    };
  }, [product]);

  // Nothing about the photo is retained once the modal closes.
  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    []
  );

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    setStage("detecting");
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    const image = new Image();
    image.onload = async () => {
      setPhoto(image);
      try {
        const detector = await loadDetector();
        const poses = await detector.estimatePoses(image, {
          flipHorizontal: false,
        });
        const keypoints = extractBodyKeypoints(poses[0]);
        const aspectRatio = garmentImage
          ? garmentImage.width / garmentImage.height
          : 0.85;
        const computed = keypoints
          ? computeGarmentPlacement(keypoints, aspectRatio)
          : fallbackPlacement(image.width, image.height, aspectRatio);
        setPlacement(computed);
        setAdjustment(NEUTRAL_ADJUSTMENT);
        setStage("ready");
        if (!keypoints) {
          toast("We could not clearly detect your pose.", {
            description:
              "Placed the piece in the centre -- drag and use the sliders to line it up.",
          });
        }
      } catch (error) {
        console.error("[Try-on] pose detection unavailable", error);
        const aspectRatio = garmentImage
          ? garmentImage.width / garmentImage.height
          : 0.85;
        setPlacement(fallbackPlacement(image.width, image.height, aspectRatio));
        setAdjustment(NEUTRAL_ADJUSTMENT);
        setStage("ready");
        toast("Automatic fitting is unavailable on this device.", {
          description: "You can still position the piece by hand.",
        });
      }
    };
    image.onerror = () => {
      toast.error("That image could not be opened. Please try another photo.");
      setStage("upload");
    };
    image.src = url;
  };

  // Redraw whenever the photo, garment, placement, or manual adjustment changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !photo || !placement) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = photo.width;
    canvas.height = photo.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(photo, 0, 0);

    if (garmentImage) {
      const fitted = applyAdjustment(placement, adjustment);
      ctx.save();
      ctx.translate(fitted.x, fitted.y);
      ctx.rotate(fitted.rotation);
      ctx.globalAlpha = 0.94;
      ctx.shadowColor = "rgba(0,0,0,0.28)";
      ctx.shadowBlur = Math.max(6, fitted.width * 0.02);
      ctx.drawImage(
        garmentImage,
        -fitted.width / 2,
        -fitted.height / 2,
        fitted.width,
        fitted.height
      );
      ctx.restore();
    }
  }, [photo, garmentImage, placement, adjustment]);

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (stage !== "ready") return;
    (event.target as HTMLCanvasElement).setPointerCapture(event.pointerId);
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const drag = dragState.current;
    const canvas = canvasRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !canvas) return;
    // Convert on-screen pixel movement into the canvas's own pixel space.
    const scaleFactor = canvas.width / canvas.getBoundingClientRect().width;
    const deltaX = (event.clientX - drag.startX) * scaleFactor;
    const deltaY = (event.clientY - drag.startY) * scaleFactor;
    dragState.current = {
      ...drag,
      startX: event.clientX,
      startY: event.clientY,
    };
    setAdjustment(current => ({
      ...current,
      offsetX: current.offsetX + deltaX,
      offsetY: current.offsetY + deltaY,
    }));
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (dragState.current?.pointerId === event.pointerId)
      dragState.current = null;
  };

  const savePreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${product.slug}-try-on.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Saved to your device.", {
      description: "This image was never uploaded anywhere.",
    });
  };

  const submitContact = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const customerName = String(form.get("customerName") ?? "").trim();
    const customerPhone = String(form.get("customerPhone") ?? "").trim();
    if (!customerName || !customerPhone) return;
    setSubmittingContact(true);
    try {
      await commerceRequest("/api/tryon-leads", {
        method: "POST",
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail: String(form.get("customerEmail") ?? "").trim(),
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          note: `Interested after a virtual try-on of ${product.name}.`,
        }),
      });
      toast.success("Thank you -- the atelier will be in touch.", {
        description:
          "Only your contact details were saved. Your photo was not sent.",
      });
      setShowContactForm(false);
    } catch (reason) {
      toast.error(
        reason instanceof Error
          ? reason.message
          : "That could not be sent. Please try again."
      );
    } finally {
      setSubmittingContact(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Virtual try-on for ${product.name}`}
      className="fixed inset-0 z-[110] grid place-items-center bg-black/80 p-4"
    >
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto bg-[#f5f2ec] p-5 sm:p-7">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close virtual try-on"
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center bg-white text-black hover:bg-[#8f6b2c] hover:text-white"
        >
          <X size={18} />
        </button>

        <p className="section-kicker">Virtual try-on</p>
        <h2 className="mt-2 font-display text-4xl leading-none">
          See {product.name} on you.
        </h2>
        <p className="mt-3 flex items-start gap-2 font-ui text-xs leading-5 text-black/60">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#8f6b2c]" />
          Your photo is processed on your own device and is never uploaded,
          stored, or sent anywhere. Closing this window discards it completely.
        </p>

        {stage === "upload" && (
          <label className="mt-7 grid cursor-pointer place-items-center gap-3 border border-dashed border-black/25 bg-white/60 px-6 py-16 text-center hover:border-[#8f6b2c]">
            <Camera size={30} className="text-[#8f6b2c]" />
            <span className="font-ui text-sm font-bold">
              Upload a full-length photo
            </span>
            <span className="font-ui text-xs text-black/55">
              JPG or PNG · stays on this device only
            </span>
            <span className="gold-button mt-2">
              <Upload size={15} /> Choose photo
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={event => void handleUpload(event)}
            />
          </label>
        )}

        {stage === "detecting" && (
          <div className="mt-7 grid place-items-center gap-3 border border-black/12 bg-white/60 px-6 py-16 text-center">
            <Loader2 size={26} className="animate-spin text-[#8f6b2c]" />
            <p className="font-ui text-sm text-black/65">
              Fitting the piece to your photo...
            </p>
          </div>
        )}

        {stage === "ready" && photo && (
          <div className="mt-7">
            <div className="relative overflow-hidden border border-black/12 bg-[#ded6ca]">
              <canvas
                ref={canvasRef}
                className="w-full touch-none select-none"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              />
            </div>
            <p className="mt-2 font-ui text-[10px] uppercase tracking-[.14em] text-black/45">
              Drag the piece to reposition it
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="font-ui text-[10px] font-bold uppercase tracking-[.16em]">
                <span className="flex items-center gap-1.5">
                  <ZoomIn size={13} /> Size
                </span>
                <input
                  type="range"
                  min={0.5}
                  max={1.8}
                  step={0.01}
                  value={adjustment.scale}
                  onChange={event =>
                    setAdjustment(current => ({
                      ...current,
                      scale: Number(event.target.value),
                    }))
                  }
                  className="mt-2 w-full"
                />
              </label>
              <label className="font-ui text-[10px] font-bold uppercase tracking-[.16em]">
                <span className="flex items-center gap-1.5">
                  <RotateCw size={13} /> Rotation
                </span>
                <input
                  type="range"
                  min={-0.35}
                  max={0.35}
                  step={0.005}
                  value={adjustment.rotationOffset}
                  onChange={event =>
                    setAdjustment(current => ({
                      ...current,
                      rotationOffset: Number(event.target.value),
                    }))
                  }
                  className="mt-2 w-full"
                />
              </label>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => {
                  setPhoto(null);
                  setStage("upload");
                }}
                className="border border-black/20 px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-[.16em] hover:border-[#8f6b2c] hover:text-[#8f6b2c]"
              >
                Try another photo
              </button>
              <button
                type="button"
                onClick={savePreview}
                className="border border-black/20 px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-[.16em] hover:border-[#8f6b2c] hover:text-[#8f6b2c]"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Download size={14} /> Save to my device
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowContactForm(true)}
                className="gold-button justify-center"
              >
                I like this fit
              </button>
            </div>

            {showContactForm && (
              <form
                onSubmit={event => void submitContact(event)}
                className="mt-6 grid gap-4 border-t border-black/12 pt-6"
              >
                <p className="font-ui text-xs leading-5 text-black/60">
                  Leave your contact and the atelier will follow up about{" "}
                  {product.name}. Your photo is not part of this -- only your
                  details are saved.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="font-ui text-[10px] font-bold uppercase tracking-[.16em]">
                    Full name
                    <input
                      name="customerName"
                      required
                      className="mt-2 w-full border-b border-black/25 bg-transparent py-3 font-ui text-sm outline-none focus:border-[#8f6b2c]"
                    />
                  </label>
                  <label className="font-ui text-[10px] font-bold uppercase tracking-[.16em]">
                    Mobile number
                    <input
                      name="customerPhone"
                      required
                      inputMode="tel"
                      className="mt-2 w-full border-b border-black/25 bg-transparent py-3 font-ui text-sm outline-none focus:border-[#8f6b2c]"
                    />
                  </label>
                  <label className="font-ui text-[10px] font-bold uppercase tracking-[.16em] sm:col-span-2">
                    Email <span className="text-black/45">optional</span>
                    <input
                      name="customerEmail"
                      type="email"
                      className="mt-2 w-full border-b border-black/25 bg-transparent py-3 font-ui text-sm outline-none focus:border-[#8f6b2c]"
                    />
                  </label>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submittingContact}
                    className="gold-button justify-center disabled:opacity-50"
                  >
                    {submittingContact ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      "Send my details"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className="border border-black/20 px-4 py-3 font-ui text-[10px] font-bold uppercase tracking-[.16em]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {stage === "unsupported" && (
          <p className="mt-7 border border-black/12 bg-white/60 px-6 py-10 text-center font-ui text-sm text-black/60">
            Virtual try-on is not supported in this browser. Please try a recent
            version of Chrome, Safari, or Firefox.
          </p>
        )}
      </div>
    </div>
  );
}
