# Performance Optimization Guide

## Current Performance

✅ **GPU Utilization**: 95% (Excellent!)
- Model is efficiently using the GPU
- Temperature: 59°C (safe range)
- Current throughput: ~63 tokens/second

## Improvements Made

### 1. Large Diff Handling ✅
**Problem**: GitHub doesn't load large diffs in DOM by default

**Solution**: 
- Extension now detects large files
- Automatically fetches them via GitHub API
- Combines DOM data (fast) + API data (for large files)
- No user action needed!

**Files Updated**:
- `src/services/github-api.ts` - Added large file detection and mixed-source loading

### 2. Performance Optimization Script Created

**Location**: `/tmp/start-vllm-optimized.sh`

**Improvements**:
- Max concurrent sequences: 16 (was 1)
- GPU memory: 90% (was 80%)
- Chunked prefill enabled
- Shared memory: 2GB
- dtype: bfloat16 for better performance

## How to Apply Optimizations

### Option 1: Apply Now (Recommended)

```bash
# Copy optimized script to DGX
scp /tmp/start-vllm-optimized.sh 192.168.1.57:~/llm-server/
ssh 192.168.1.57 'chmod +x ~/llm-server/start-vllm-optimized.sh'

# Stop current server and start optimized version
ssh 192.168.1.57 '~/llm-server/start-vllm-optimized.sh'
```

**Expected improvements**:
- Better throughput when reviewing multiple files
- Faster batch processing
- More efficient GPU memory usage

### Option 2: Apply Later

The current server works great! Apply optimizations when:
- Reviewing very large PRs (20+ files)
- Want maximum throughput
- Notice slowdowns

## Performance Tips

### For Best Results

1. **Stay on "Files changed" tab** when generating reviews
   - DOM extraction is instant
   - API calls take 1-2 seconds per file

2. **Review during off-peak hours** 
   - GitHub API rate limits: 60/hour unauthenticated
   - Add GitHub token for 5000/hour

3. **Let first request warm up**
   - First review: 10-30 seconds (model loading)
   - Subsequent reviews: 5-15 seconds

### Model Upgrade Path

If you want better quality reviews:

| Model | Size | Speed | Quality | VRAM |
|-------|------|-------|---------|------|
| Current: deepseek-coder-1.3b | 1.3B | Fast ⚡ | Good ✓ | ~3GB |
| deepseek-coder-6.7b | 6.7B | Medium | Better ✓✓ | ~14GB |
| deepseek-coder-33b | 33B | Slower | Best ✓✓✓ | ~66GB |

## Monitoring Commands

### Check GPU Usage
```bash
ssh 192.168.1.57 'nvidia-smi'
```

### Monitor Real-time Activity
```bash
ssh 192.168.1.57 'docker logs -f vllm-code-review'
```

### Check Server Status
```bash
curl http://192.168.1.57:8000/v1/models
```

## Troubleshooting

### Reviews Taking Too Long
- Check GPU utilization: `ssh 192.168.1.57 nvidia-smi`
- Apply optimized script (see above)
- Reduce "Max Issues Per File" in settings

### "No files to review"
- Ensure you're on "Files changed" tab
- Check browser console (F12) for errors
- Large files now handled automatically via API

### API Rate Limit Hit
Add GitHub token to extension settings:
1. Create token: github.com/settings/tokens
2. Add to extension settings (coming soon)
3. Rate limit increases to 5000/hour

## Current Configuration

**Server**: Running with default settings
- Works great for most use cases
- 95% GPU utilization
- 63 tokens/second throughput

**Extension**: v4.0.0
- Large diff handling: ✅ Enabled
- Mixed source loading: ✅ Enabled
- Auto API fallback: ✅ Enabled

## Next Steps

1. **Keep using current setup** - it's working well!
2. **Apply optimizations** when reviewing large PRs
3. **Upgrade model** if you need better quality

Your current setup is already performing excellently at 95% GPU utilization! 🎉
